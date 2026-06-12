import {useEffect, useMemo, useRef, useState} from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import UserData from "../../domain/UserData";
import {AddressBalanceResult, MetaMaskAccount, MetaMaskWallet} from "./MetaMaskWallet";
import {getPublicClient, readContracts} from "@wagmi/core";
import {wagmiConfig} from '../../../wagmiConfig';
import erc20top100 from "./../../../resources/erc20top100_2023.json"
import useInterval from "../../utils/useInterval";
import StorageFactory from "../../domain/StorageFactory";
import AssetDTO, {crypto} from "../../domain/AssetDTO";
import {chainIdToName, metaMaskChains} from "./MetaMaskChains";
import BinanceCurrencyResponse from "../binance/BinanceCurrencyResponse";
import CoinGeckoCurrencyResponse from "../coingecko/CoinGeckoCurrencyResponse";
import PLATFORM_CHAINID from "../coingecko/platforms";
import {createDemoMetamaskAssets} from "../../utils/DemoAssetsGenerator";
import {erc20Abi, formatUnits} from "viem";

interface BalanceRequest {
    token?: `0x${string}` // undefined → native balance
    chainId: number
    symbol: string
    address: `0x${string}` // the WALLET address being scanned
}

const BATCH_SIZE = 300;
const REQUEST_DELAY_MS = 2000;
const FAILURE_PAUSE_MS = 60_000;       // back off after a whole-batch RPC failure (rate limit etc.)
const SCAN_INTERVAL_MS = 30 * 60_000;  // re-sweep the full list at most this often (no re-scan per mount)

// Scan only chains we can and should query: configured in wagmi AND live mainnets.
// (PLATFORM_CHAINID already limits us to EVM mainnets; this also drops anything wagmi no
// longer knows, which otherwise produced ChainNotConfiguredError.)
const SCANNABLE_CHAIN_IDS = new Set(
    metaMaskChains.filter(c => !c.testnet).map(c => c.id)
);

// The AssetDTO id for a stored balance. Kept in one place so the per-asset refresh can
// match an asset id back to its balance entry without parsing the name string.
const balanceAssetId = (b: AddressBalanceResult) =>
    `metamask ${b.symbol} ${chainIdToName[b.chainId] || b.chainId} ${b.address}`;

const REDUCE_BATCH_SIZE_ERROR = "error, reduce batch size";
export default function MetaMaskLoader(
    isDemoMode: boolean,
    loadingUserDataAllowed: boolean,
    binanceCurrencies: { [symbol: string]: BinanceCurrencyResponse } | null,
    coinGeckoCurrencies: { [symbol: string]: CoinGeckoCurrencyResponse } | null,
    storageFactory: StorageFactory,
    userData: UserData
) {

    const [metaMaskSettingsEnabled, setMetaMaskSettingsEnabled] = useState(
        userData.settings.metaMask?.enabled
    );
    useEffect(() => {
        setMetaMaskSettingsEnabled(userData.settings.metaMask?.enabled)
    }, [userData.settings.metaMask?.enabled]);

    const [hasProvider, setHasProvider] = useState<boolean>(false)
    const initialState = {} as MetaMaskWallet
    const [wallet, setWallet] = useState(initialState)

    const [isConnecting, setIsConnecting] = useState(false)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        const refreshAccounts = (accounts: any) => {
            if (accounts.length > 0) {
                updateWallet(accounts)
            } else {
                // if length 0, user is disconnected
                setWallet(initialState)
            }
        }

        const refreshChain = (chainId: any) => {
            setWallet((wallet) => ({...wallet, chainId}))
        }

        const getProvider = async () => {
            const provider = await detectEthereumProvider({silent: true})
            setHasProvider(Boolean(provider))

            if (provider) {
                const accounts = await window.ethereum.request(
                    {method: 'eth_accounts'}
                )
                refreshAccounts(accounts)
                window.ethereum.on('accountsChanged', refreshAccounts)
                window.ethereum.on("chainChanged", refreshChain)
            }
        }

        getProvider()

        return () => {
            window.ethereum?.removeListener('accountsChanged', refreshAccounts)
            window.ethereum?.removeListener("chainChanged", refreshChain)
        }
    }, [])

    const updateWallet = async (accounts: string[]) => {
        const balance = formatBalance(await window.ethereum!.request({
            method: "eth_getBalance",
            params: [accounts[0], "latest"],
        }))
        const chainId = await window.ethereum!.request({
            method: "eth_chainId",
        })
        const newWallet = {accounts, balance, chainId} as MetaMaskWallet;
        setWallet(newWallet)
    }

    const handleConnect = async () => {
        setIsConnecting(true)
        await window.ethereum
            .request({
                method: "eth_requestAccounts",
            })
            .then((accounts: []) => {
                setError(false)
                updateWallet(accounts)
            })
            .catch((err: any) => {
                setError(true)
                setErrorMessage(err.message)
            })
        setIsConnecting(false)
    }

    // ERC-20 decimals never change for a deployed contract, so resolve them once (lazily, only
    // for tokens the wallet actually holds) and reuse. Keyed chainId:contract (lowercased).
    const decimalsCache = useRef<Map<string, number>>(new Map());
    const decimalsKey = (chainId: number, token: string) => `${chainId}:${token.toLowerCase()}`;

    // Build the scan list from the CoinGecko per-chain contract addresses (covers ~all popular
    // tokens, e.g. XAUT, that the small Uniswap list omitted). No decimals here — fetched lazily.
    const getAllOptions = (address: string): BalanceRequest[] => {
        const optionEth = {address: address as `0x${string}`, chainId: 1, symbol: "ETH"} as BalanceRequest;
        if (!coinGeckoCurrencies) {
            return [optionEth];
        }
        const tokenOptions: BalanceRequest[] = [];
        Object.values(coinGeckoCurrencies).forEach(coin => {
            if (!coin.platforms) return;
            Object.entries(coin.platforms).forEach(([platform, rawAddr]) => {
                const chainId = PLATFORM_CHAINID[platform];
                if (!chainId || !SCANNABLE_CHAIN_IDS.has(chainId) || !rawAddr) return;
                const token = rawAddr.toLowerCase();
                if (!/^0x[0-9a-f]{40}$/.test(token)) return;
                tokenOptions.push({
                    address: address as `0x${string}`,
                    token: token as `0x${string}`,
                    chainId,
                    symbol: coin.symbol.toUpperCase(),
                });
            });
        });
        return [optionEth, ...tokenOptions];
    }

    // Rebuild the BalanceRequest for a stored balance (used by the single-token refresh). The
    // contract address isn't stored, so look it up in the CoinGecko map by symbol → platform.
    const requestForBalance = (b: AddressBalanceResult): BalanceRequest | null => {
        const coin = coinGeckoCurrencies?.[b.symbol];
        if (coin?.platforms) {
            const entry = Object.entries(coin.platforms)
                .find(([p, addr]) => PLATFORM_CHAINID[p] === b.chainId && addr);
            if (entry) {
                return {address: b.address, token: entry[1].toLowerCase() as `0x${string}`,
                    chainId: b.chainId, symbol: b.symbol};
            }
        }
        if (b.symbol === "ETH" && b.chainId === 1) {
            return {address: b.address, chainId: 1, symbol: "ETH"};
        }
        return null;
    };

    const [batchSize, setBatchSize] = useState(BATCH_SIZE)

    const [
        metaMaskUserData,
        setMetaMaskUserData
    ] = storageFactory.createStorage<MetaMaskAccount>("metamaskUserData", () => ({} as MetaMaskAccount));

    // Persisted scan progress so we don't re-scan the whole list on every mount.
    //   sig         — identifies the wallet (accounts); a change forces a fresh sweep. NOT tied to
    //                 the token-universe size: the CoinGecko directory drifts day-to-day, and tying
    //                 the cursor to its length would silently discard a half-finished sweep on reload.
    //   index       — sweep cursor into `options`; 0 between sweeps, >0 mid-sweep (resumes on reload)
    //   completedAt — set ONLY when the cursor reached the end of a full pass; gates the cooldown
    //   updatedAt   — timestamp of the last tick; a mid-sweep older than the cooldown is too stale to
    //                 resume (its head data has aged out) so we start over instead
    const [scanState, setScanState] = storageFactory.createStorage<{ sig: string; index: number; completedAt: number; updatedAt: number }>(
        "metamaskScan", () => ({sig: '', index: 0, completedAt: 0, updatedAt: 0})
    );
    const scanPauseUntil = useRef(0); // RPC backoff after a whole-batch failure
    const scanning = useRef(false);   // prevent overlapping ticks when a batch runs > REQUEST_DELAY_MS

    const addBalance = (acc: MetaMaskAccount, b: AddressBalanceResult) => {
        (acc[b.address] ||= {})[b.symbol] ||= {};
        acc[b.address][b.symbol][b.chainId] = b;
    };
    const removeBalance = (acc: MetaMaskAccount, b: { address: `0x${string}`; symbol: string; chainId: number }): boolean => {
        if (!acc[b.address]?.[b.symbol]?.[b.chainId]) return false;
        delete acc[b.address][b.symbol][b.chainId];
        if (!Object.keys(acc[b.address][b.symbol]).length) delete acc[b.address][b.symbol];
        if (!Object.keys(acc[b.address]).length) delete acc[b.address];
        return true;
    };

    const metaMaskAssets = useMemo(() => {
        if (isDemoMode) {
            return createDemoMetamaskAssets()
        }
        if (!binanceCurrencies || !userData.settings?.metaMask?.enabled) {
            return []
        }
        const balances = Object.values(metaMaskUserData)
            .map(e => Object.values(e))
            .reduce((a, b) => a.concat(b), [])
            .map(e => Object.values(e))
            .reduce((a, b) => a.concat(b), []);
        return balances.map(balance => {
            const id = balanceAssetId(balance);
            const name = id.replace(/^metamask /, "");
            const decimalScale = binanceCurrencies[balance.symbol]?.precision || 8;
            return new AssetDTO(
                id,
                balance.symbol,
                balance.formatted,
                name,
                decimalScale,
                crypto,
                false,
                false,
                false,
                false,
                null,
                true,
            )
        })
    }, [metaMaskUserData])

    const fetchAllBalances = async (requests: BalanceRequest[]) => {
        const tokenRequests = requests
            .map((req, index) => ({req, index}))
            .filter(({req}) => !!req.token);

        // Phase A — balanceOf (raw bigint; detecting non-zero needs no decimals)
        const contracts = tokenRequests.map(({req}) => ({
            address: req.token!,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [req.address],
            chainId: req.chainId,
        }));

        let tokenResults;
        try {
            tokenResults = contracts.length ? await readContracts(wagmiConfig, {contracts, allowFailure: true}) : [];
        } catch (e) {
            console.warn("Error fetching token balance", e)
            if (requests.length === 1) {
                return [null];
            }
            throw new Error(REDUCE_BATCH_SIZE_ERROR);
        }

        // non-zero hits (a revert / down RPC / etc. stays null and is skipped, as before)
        const hits = tokenResults
            .map((res, idx) => ({res, ...tokenRequests[idx]}))
            .filter(({res}) => res.status === 'success' && (res.result as bigint) > 0n)
            .map(({req, index, res}) => ({req, index, value: res.result as bigint}));

        // Phase B — resolve decimals ONLY for the non-zero hits we haven't seen before
        const needDecimals = hits.filter(h => !decimalsCache.current.has(decimalsKey(h.req.chainId, h.req.token!)));
        if (needDecimals.length) {
            let decResults: any[] = [];
            try {
                decResults = await readContracts(wagmiConfig, {
                    contracts: needDecimals.map(h => ({
                        address: h.req.token!, abi: erc20Abi, functionName: 'decimals', chainId: h.req.chainId,
                    })),
                    allowFailure: true,
                });
            } catch { /* whole decimals call failed — those tokens just resolve next round */ }
            decResults.forEach((res, i) => {
                if (res && res.status === 'success') {
                    const h = needDecimals[i];
                    decimalsCache.current.set(decimalsKey(h.req.chainId, h.req.token!), Number(res.result));
                }
            });
        }

        const nativePromises = (requests.map((req, index) => {
            if (req.token) return null;
            const client = getPublicClient(wagmiConfig, {chainId: req.chainId});
            if (!client) return Promise.resolve({index, result: null});
            return client.getBalance({address: req.address})
                .then(result => ({index, result}))
                // chain RPC down / flaky → skip this native balance, never reject the batch
                .catch(() => ({index, result: null}));
        }).filter(Boolean)) as Promise<{ index: number, result: bigint | null }>[];

        const nativeResults = await Promise.all(nativePromises);
        const results: Array<AddressBalanceResult | null> = new Array(requests.length).fill(null);

        hits.forEach(({req, index, value}) => {
            const decimals = decimalsCache.current.get(decimalsKey(req.chainId, req.token!));
            if (decimals === undefined) return; // decimals unresolved (rare) → skip; retried next round
            results[index] = {
                chainId: req.chainId,
                address: req.address,
                decimals,
                formatted: formatUnits(value, decimals),
                symbol: req.symbol,
                value: value.toString(),
            }
        });

        // confirmed-zero tokens (success but balance 0) → a "0" marker, distinct from null
        // (errored/skipped). Lets the sweep / refresh DROP a sold-out token without re-fetching
        // decimals, while never removing a token whose chain just errored.
        tokenResults.forEach((res, idx) => {
            const {req, index} = tokenRequests[idx];
            if (res.status === 'success' && (res.result as bigint) === 0n) {
                results[index] = {
                    chainId: req.chainId, address: req.address, symbol: req.symbol,
                    decimals: 0, formatted: "0", value: "0",
                }
            }
        });

        nativeResults.forEach(({index, result}) => {
            const req = requests[index];
            if (result !== null) {
                results[index] = {
                    chainId: req.chainId,
                    address: req.address,
                    decimals: 18,
                    formatted: formatUnits(result, 18),
                    symbol: req.symbol,
                    value: result.toString(),
                }
            }
        });

        return results;
    }

    // Targeted single-token refresh: re-fetch ONE already-known balance (1 RPC call) instead
    // of rescanning the whole token list. Returns false when nothing was updated.
    const refreshMetaMaskAsset = async (assetId: string): Promise<boolean> => {
        if (isDemoMode) {
            // no real wallet behind demo data — just let the UI show its spinner briefly
            await new Promise(r => setTimeout(r, 800));
            return true;
        }
        let balance: AddressBalanceResult | null = null;
        Object.values(metaMaskUserData).forEach(bySymbol =>
            Object.values(bySymbol).forEach(byChain =>
                Object.values(byChain).forEach(b => {
                    if (balanceAssetId(b) === assetId) balance = b;
                })));
        if (!balance) return false;
        const request = requestForBalance(balance);
        if (!request) return false;
        const [result] = await fetchAllBalances([request]);
        if (!result) return false; // errored — couldn't confirm, leave the row as is
        const newData = {...metaMaskUserData};
        if (Number(result.value)) {
            addBalance(newData, result);             // non-zero → update
        } else {
            removeBalance(newData, result);          // confirmed zero → drop the row
        }
        setMetaMaskUserData(newData);
        return true;
    };

    const options = useMemo<BalanceRequest[]>(() => {
        // wait for the CoinGecko token directory — it supplies the contract addresses to scan
        if (!wallet || !wallet.accounts?.length || !coinGeckoCurrencies) {
            return []
        }
        return wallet.accounts.map(account => getAllOptions(account))
            .reduce((a, b) => a.concat(b), [])
            .sort((a, b) => {
                if (a.symbol === "ETH") return -1
                if (b.symbol === "ETH") return 1
                const numberA = (erc20top100.indexOf(a.symbol) + 1) || 100;
                const numberB = (erc20top100.indexOf(b.symbol) + 1) || 100;
                return (numberA - numberB) || -1
            })
    }, [wallet, coinGeckoCurrencies])

    // One sweep slice per tick. Resumes from the persisted cursor, backs off on RPC failure,
    // and stays idle once a full pass completed recently (no full re-scan on every mount).
    const scanTick = async () => {
        if (scanning.current) return;
        if (!wallet?.accounts?.length || !metaMaskSettingsEnabled || !options.length || !loadingUserDataAllowed) return;
        if (Date.now() < scanPauseUntil.current) return;

        const now = Date.now();
        const sig = wallet.accounts.join(',');  // the wallet identifies the scan
        const st = scanState;
        const sameWallet = st.sig === sig;

        // Cooldown: a *full* pass finished recently for this wallet → stay completely idle.
        // `completedAt` is only ever stamped when the cursor reached the end (see below), so the
        // cooldown can never engage on a partial scan.
        if (sameWallet && st.completedAt && now - st.completedAt < SCAN_INTERVAL_MS) return;

        // Where to start: resume a half-finished sweep ONLY when it's the same wallet, still
        // mid-list, and recent (last tick < cooldown ago — older means its head data has aged out,
        // so we start fresh). Anything else (new wallet, completed-but-cooldown-expired, stale
        // partial, cursor past a now-shorter list) restarts the sweep from the top.
        let index = 0;
        if (sameWallet && !st.completedAt && st.index > 0 && st.index < options.length
            && now - st.updatedAt < SCAN_INTERVAL_MS) {
            index = st.index;
        }

        scanning.current = true;
        try {
            const slice = options.slice(index, index + (batchSize === 2 ? 1 : batchSize));
            const results = await fetchAllBalances(slice);
            const merged = {...metaMaskUserData};
            let changed = false;
            results.forEach(r => {
                if (!r) return;                                              // errored/skipped → keep
                if (Number(r.value)) { addBalance(merged, r); changed = true; }   // non-zero → add/update
                else if (removeBalance(merged, r)) changed = true;          // confirmed zero → drop
            });
            if (changed) setMetaMaskUserData(merged);

            const nextIndex = index + slice.length;
            const stamp = Date.now();
            if (nextIndex >= options.length) {
                // cursor walked the whole list → cooldown starts now
                setScanState({sig, index: 0, completedAt: stamp, updatedAt: stamp});
                console.log(`metamask scan complete: ${options.length} tokens — idle for ${SCAN_INTERVAL_MS / 60000}m`);
            } else {
                if (index === 0) console.log(`metamask scan: sweeping ${options.length} tokens`);
                setScanState({sig, index: nextIndex, completedAt: 0, updatedAt: stamp});
            }
            if (batchSize < BATCH_SIZE) {
                setBatchSize(b => Math.min(BATCH_SIZE, b * 2));
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            scanPauseUntil.current = Date.now() + FAILURE_PAUSE_MS;
            setBatchSize(b => Math.max(1, Math.floor(b / 2)));
            if (message !== REDUCE_BATCH_SIZE_ERROR) {
                console.log("metamask: pausing + reducing batch", message)
            }
        } finally {
            scanning.current = false;
        }
    };

    useInterval(
        () => { scanTick().catch(e => console.warn(e)); },
        (wallet?.accounts?.length && metaMaskSettingsEnabled && loadingUserDataAllowed) ? REQUEST_DELAY_MS : null
    );

    return {
        metaMaskSettingsEnabled, setMetaMaskSettingsEnabled,
        metaMaskAssets,
        refreshMetaMaskAsset,
        metaMaskWallet: wallet,
        metaMaskIsError: error,
        metaMaskHandleConnect: handleConnect,
        metaMaskErrorMessage: errorMessage,
        metaMaskHasProvider: hasProvider,
        metaMaskIsConnecting: isConnecting,
    }
}

export const formatBalance = (rawBalance: string) => {
    return String(parseInt(rawBalance) / 1000000000000000000)
}
