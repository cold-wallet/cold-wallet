import ApiResponse from "../../domain/ApiResponse";
import fiatCurrencies from "../../fiatCurrencies";
import AssetDTO, {AssetType} from "../../domain/AssetDTO";

// ccxt bundles ~100 exchange modules (tens of MB unbundled in dev). Importing it at the
// top of this module used to drag the whole library into the initial render path on every
// app start (this module is pulled in by CcxtLoader, the settings dialog, etc.). Load it
// LAZILY instead — only when an exchange list or balance is actually requested.
let ccxtPromise: Promise<any> | null = null;
let exchangesCache: string[] = [];

function loadCcxt(): Promise<any> {
    if (!ccxtPromise) {
        ccxtPromise = import("ccxt").then((m) => {
            const lib = (m as any).default || m;
            exchangesCache = lib.exchanges || [];
            return lib;
        });
    }
    return ccxtPromise;
}

const ccxtConnector = {
    /** Cached exchange list (empty until ccxt has finished loading); also kicks off the load. */
    getExchanges(): string[] {
        void loadCcxt();
        return exchangesCache;
    },
    /** Awaits ccxt, then returns the full exchange list. */
    async getExchangesAsync(): Promise<string[]> {
        await loadCcxt();
        return exchangesCache;
    },
    async loadUserData(exchange: string, apiKey: string, apiSecret: string | null, password: string | null,
                       additionalSetting: string | null): Promise<ApiResponse<AssetDTO[]>> {
        const ccxt = await loadCcxt();
        const exchangeClass = (ccxt as any)[exchange];
        if (exchangeClass) {
            try {
                const exchangeInstance = new exchangeClass({
                    apiKey: apiKey,
                    secret: apiSecret,
                    password: password,
                });
                const balances: { [currency: string]: number } = await exchangeInstance.fetchTotalBalance()
                const nonZeroBalances = {} as { [currency: string]: number }
                Object.entries(balances)
                    .filter(([, total]) => Number(total))
                    .forEach(([currency, total]) => nonZeroBalances[currency] = total)
                console.log(`successfully loaded ${exchange} account data`, nonZeroBalances)
                const assets = Object.entries(nonZeroBalances)
                    .map(([currency, total]) => {
                        const name = `${currency} SPOT`;
                        const fiatCurrency = fiatCurrencies.getByStringCode(currency);
                        const isFiat = !!fiatCurrency
                        return new AssetDTO(
                            `${exchange}_${name}`,
                            currency,
                            String(total),
                            name,
                            fiatCurrency?.afterDecimalPoint || 8, // todo: in future, inject correct value by fetching from appropriate service
                            isFiat ? AssetType.fiat : AssetType.crypto,
                            false,
                            false,
                            false,
                            true,
                            exchange,
                        );
                    })
                return ApiResponse.success(200, assets)
            } catch (error: any) {
                console.error(error)
                return ApiResponse.fail(
                    error?.response?.status,
                    error.message || error.response?.data?.errorDescription,
                )
            }
        }
        return ApiResponse.fail(0, `unknown exchange ${exchange}`);
    }
}

export default ccxtConnector
