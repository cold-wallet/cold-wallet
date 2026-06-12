import ApiResponse from "../../domain/ApiResponse";
import axios, {AxiosResponse} from "axios";
import CoinGeckoCurrencyResponse from "./CoinGeckoCurrencyResponse";
import CoinGeckoPriceResponse from "./CoinGeckoPriceResponse";
import PLATFORM_CHAINID from "./platforms";

const name = "coingecko"
const apiBaseUrl = "https://api.coingecko.com"
const apiPrefix = "/api/v3"

// CoinGecko's /coins/list has thousands of symbol collisions (dozens of coins share "ETH",
// "BTC", …) and is NOT ordered by anything useful, so a positional tiebreak picks a random
// impostor (e.g. "the-ticker-is-eth" / "osmosis-allbtc"). Pin the canonical CoinGecko id for
// the symbols that matter; these win over whatever the generic merge picked. Verified against
// the live /coins/list. Anything not listed falls back to first-occurrence (still arbitrary
// for the long tail, but deterministic — see fetchCurrencies).
const CANONICAL_IDS: { [symbol: string]: string } = {
    BTC: "bitcoin", ETH: "ethereum", USDT: "tether", BNB: "binancecoin", SOL: "solana",
    USDC: "usd-coin", XRP: "ripple", DOGE: "dogecoin", ADA: "cardano", TRX: "tron",
    AVAX: "avalanche-2", SHIB: "shiba-inu", LINK: "chainlink", DOT: "polkadot", BCH: "bitcoin-cash",
    LTC: "litecoin", NEAR: "near", MATIC: "matic-network", POL: "polygon-ecosystem-token", UNI: "uniswap",
    ICP: "internet-computer", APT: "aptos", XLM: "stellar", ETC: "ethereum-classic", ATOM: "cosmos",
    FIL: "filecoin", HBAR: "hedera-hashgraph", CRO: "crypto-com-chain", ARB: "arbitrum", OP: "optimism",
    VET: "vechain", MKR: "maker", INJ: "injective-protocol", AAVE: "aave", GRT: "the-graph",
    STX: "blockstack", RENDER: "render-token", RNDR: "render-token", IMX: "immutable-x", SUI: "sui",
    SEI: "sei-network", TIA: "celestia", TON: "the-open-network", WBTC: "wrapped-bitcoin", DAI: "dai",
    LDO: "lido-dao", FTM: "fantom", ALGO: "algorand", QNT: "quant-network", FLOW: "flow",
    SAND: "the-sandbox", MANA: "decentraland", AXS: "axie-infinity", XTZ: "tezos", EOS: "eos",
    RUNE: "thorchain", PEPE: "pepe", WIF: "dogwifcoin", BONK: "bonk", FLOKI: "floki",
    JUP: "jupiter-exchange-solana", ENA: "ethena", ONDO: "ondo-finance", KAS: "kaspa", TWT: "trust-wallet-token",
    GALA: "gala", CHZ: "chiliz", SNX: "havven", CRV: "curve-dao-token", FET: "fetch-ai",
    EGLD: "elrond-erd-2", THETA: "theta-token", KAVA: "kava", BUSD: "binance-usd", TUSD: "true-usd",
    FDUSD: "first-digital-usd", USDD: "usdd", WETH: "weth", WSTETH: "wrapped-steth", STETH: "staked-ether",
};

const apiClient = {
    async fetchPrices(
        currencies: { [index: string]: CoinGeckoCurrencyResponse },
        subCurrencies: string[],
    ): Promise<ApiResponse<CoinGeckoPriceResponse | any>> {
        try {
            const currencyIdToSymbol = Object
                .values(currencies)
                .reduce((merged, current) => {
                    merged.set(current.id, current.symbol)
                    return merged
                }, new Map<string, string>())
            const currenciesParam = Object
                .values(currencies)
                .map(currency => currency.id)
                .join(",")
            const vsCurrencies = subCurrencies.join(",")
            const urlPrices = apiBaseUrl + apiPrefix + "/simple/price";
            const pricesResponse: AxiosResponse<CoinGeckoPriceResponse>
                = await axios.get(urlPrices, {
                params: {
                    ids: currenciesParam,
                    vs_currencies: vsCurrencies,
                    precision: "full",
                }
            });
            if (pricesResponse.data && Object.keys(pricesResponse.data).length) {
                const result = Object.entries(pricesResponse.data)
                    .reduce((merged, [currency, prices]) => {
                        const symbol = currencyIdToSymbol.get(currency)
                        symbol && (merged[symbol] = prices)
                        return merged
                    }, {} as CoinGeckoPriceResponse)
                return ApiResponse.success(200, result,)
            }
            return ApiResponse.fail(
                0,
                "empty response",
            )
        } catch (error: any) {
            console.warn(`Error fetching prices from ${name}:`, error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    },
    async fetchCurrencies(): Promise<ApiResponse<{ [index: string]: CoinGeckoCurrencyResponse } | any>> {
        try {
            // include_platform gives per-chain contract addresses, used to drive the MetaMask
            // token scan (covers tokens the small Uniswap list omits, e.g. XAUT/Tether Gold).
            const url = apiBaseUrl + apiPrefix + "/coins/list";
            const response: AxiosResponse<CoinGeckoCurrencyResponse[]> = await axios.get(url, {
                params: {include_platform: true},
            });
            if (response.data?.length) {
                const list = response.data;
                const byId = list.reduce((m: { [id: string]: CoinGeckoCurrencyResponse }, c) => {
                    m[c.id] = c;
                    return m;
                }, {});
                // Keep only scannable-EVM platform addresses (drop Solana/Tron/TON/… and testnets)
                // so the persisted map stays ~1.6MB instead of ~2.1MB, and copy to a fresh object
                // so we never mutate the raw response.
                const trim = (c: CoinGeckoCurrencyResponse): CoinGeckoCurrencyResponse => {
                    const platforms: { [p: string]: string } = {};
                    if (c.platforms) Object.entries(c.platforms).forEach(([p, addr]) => {
                        if (PLATFORM_CHAINID[p] && addr) platforms[p] = addr;
                    });
                    return {id: c.id, symbol: c.symbol, name: c.name,
                        ...(Object.keys(platforms).length ? {platforms} : {})};
                };
                // keep the FIRST coin seen for each symbol (deterministic; the list order is
                // not meaningful, so this is just a stable default for the long tail) …
                const currencies = list
                    .reduce((merged: { [p: string]: CoinGeckoCurrencyResponse }, currency) => {
                        const symbol = currency.symbol.toUpperCase();
                        if (!merged[symbol]) merged[symbol] = trim(currency);
                        return merged
                    }, {});
                // … then force the canonical coin for well-known symbols, so e.g. ETH is
                // always Ethereum and BTC always Bitcoin regardless of impostor entries.
                Object.entries(CANONICAL_IDS).forEach(([symbol, id]) => {
                    if (byId[id]) currencies[symbol] = trim(byId[id]);
                });
                return ApiResponse.success(200, currencies,)
            } else {
                return ApiResponse.fail(
                    0,
                    "empty response",
                )
            }
        } catch (error: any) {
            console.warn(`Error fetching currencies from ${name}:`, error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    },
    async fetchSubCurrencies(): Promise<ApiResponse<string[] | any>> {
        try {
            const urlVsCurrencies = apiBaseUrl + apiPrefix + "/simple/supported_vs_currencies";
            const response: AxiosResponse<string[]> = await axios.get(urlVsCurrencies);
            if (response.data?.length) {
                return ApiResponse.success(200, response.data,)
            } else {
                return ApiResponse.fail(
                    0,
                    "empty response",
                )
            }
        } catch (error: any) {
            console.warn(`Error fetching currencies from ${name}:`, error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    },

}

export default apiClient;
