import {useEffect, useMemo, useState} from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import UserData from "../../domain/UserData";
import {AddressBalanceResult, MetaMaskAccount, MetaMaskWallet} from "./MetaMaskWallet";
import {getPublicClient, readContracts} from "@wagmi/core";
import {wagmiConfig} from '../../../wagmiConfig';
import defaultTokens from "@uniswap/default-token-list"
import erc20top100 from "./../../../resources/erc20top100_2023.json"
import useInterval from "../../utils/useInterval";
import StorageFactory from "../../domain/StorageFactory";
import AssetDTO, {crypto} from "../../domain/AssetDTO";
import {chainIdToName, metaMaskChains} from "./MetaMaskChains";
import BinanceCurrencyResponse from "../binance/BinanceCurrencyResponse";
import {createDemoMetamaskAssets} from "../../utils/DemoAssetsGenerator";
import {erc20Abi, formatUnits} from "viem";

interface Token {
    chainId: number
    address: string
    name: string
    symbol: string
    decimals: number
    logoURI: string
    extensions: any
}

interface BalanceRequest {
    token?: `0x${string}`
    chainId: number
    symbol: string
    address: `0x${string}`
    decimals: number
}

const BATCH_SIZE = 10;
const REQUEST_DELAY_MS = 2000;

// Scan only chains we can and should query: configured in wagmi AND live mainnets.
// The token list still carries entries for testnets and for chains viem no longer knows
// (Ropsten/Rinkeby) — querying those produced ChainNotConfiguredError plus a cascade of
// unhandled rejections, and dead-testnet RPC failures kept shrinking the batch size.
const SCANNABLE_CHAIN_IDS = new Set(
    metaMaskChains.filter(c => !c.testnet).map(c => c.id)
);
// the token list's chain-42 entries are Kovan-era; id 42 belongs to LUKSO now
SCANNABLE_CHAIN_IDS.delete(42);
const scannableTokens = ((defaultTokens.tokens || []) as Token[])
    .filter(t => SCANNABLE_CHAIN_IDS.has(t.chainId));

// The AssetDTO id for a stored balance. Kept in one place so the per-asset refresh can
// match an asset id back to its balance entry without parsing the name string.
const balanceAssetId = (b: AddressBalanceResult) =>
    `metamask ${b.symbol} ${chainIdToName[b.chainId] || b.chainId} ${b.address}`;

// Rebuild the BalanceRequest for a stored balance. The token CONTRACT address is not kept in
// storage, so look it up in the Uniswap default list by symbol+chainId (preferring a matching
// decimals on collisions). Falls back to the native-ETH request; null if unresolvable.
function requestForBalance(b: AddressBalanceResult): BalanceRequest | null {
    const candidates = scannableTokens
        .filter(t => t.symbol === b.symbol && t.chainId === b.chainId);
    const token = candidates.find(t => t.decimals === b.decimals) || candidates[0];
    if (token) {
        return {
            address: b.address,
            token: token.address as `0x${string}`,
            chainId: token.chainId,
            symbol: token.symbol,
            decimals: token.decimals,
        };
    }
    if (b.symbol === "ETH" && b.chainId === 1) {
        return {address: b.address, chainId: 1, symbol: "ETH", decimals: 18};
    }
    return null;
}

const REDUCE_BATCH_SIZE_ERROR = "error, reduce batch size";
export default function MetaMaskLoader(
    isDemoMode: boolean,
    loadingUserDataAllowed: boolean,
    binanceCurrencies: { [symbol: string]: BinanceCurrencyResponse } | null,
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

    const getAllOptions = (address: string): BalanceRequest[] => {
        const tokenToOption = (token: Token) => ({
            address,
            token: token.address,
            chainId: token.chainId,
            symbol: token.symbol,
            decimals: token.decimals,
        } as BalanceRequest)
        const tokenOptions = [...scannableTokens]
            .sort((a, b) => {
                const numberA = (erc20top100.indexOf(a.symbol) + 1) || 100;
                const numberB = (erc20top100.indexOf(b.symbol) + 1) || 100;
                return (numberA - numberB) || -1
            })
            .map(tokenToOption)
        const optionEth = {
            address,
            chainId: 1,
            symbol: "ETH",
            decimals: 18,
        } as BalanceRequest;
        return [optionEth, ...tokenOptions]
    }
    const [fullResult, setFullResult] = useState<Array<AddressBalanceResult | null>>([])
    const [isLoaded, setIsLoaded] = useState(false)
    const [batchSize, setBatchSize] = useState(BATCH_SIZE)

    const nonZeroTokens = useMemo(() => {
        const filtered = fullResult.filter(balance =>
            balance && Number(balance.value));
        return filtered as AddressBalanceResult[]
    }, [fullResult])

    const [
        metaMaskUserData,
        setMetaMaskUserData
    ] = storageFactory.createStorage<MetaMaskAccount>("metamaskUserData", () => ({} as MetaMaskAccount));

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

    useEffect(() => {
        if (!(nonZeroTokens?.length)) {
            return
        }
        const newData = isLoaded ? {} as MetaMaskAccount : {...metaMaskUserData}
        nonZeroTokens.forEach(token => {
            if (!newData[token.address]) {
                newData[token.address] = {}
            }
            if (!newData[token.address][token.symbol]) {
                newData[token.address][token.symbol] = {}
            }
            if (!newData[token.address][token.symbol][token.chainId]) {
                newData[token.address][token.symbol][token.chainId] = token
            }
        })
        setMetaMaskUserData(newData)
    }, [nonZeroTokens, isLoaded]);

    const fetchAllBalances = async (requests: BalanceRequest[]) => {
        const tokenRequests = requests
            .map((req, index) => ({req, index}))
            .filter(({req}) => !!req.token);

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

        tokenResults.forEach((res, idx) => {
            const {req, index} = tokenRequests[idx];
            // Only successes carry a balance. Anything else (a revert, a chain whose RPC is
            // down / rate-limited / gated, a timeout, …) just means "no balance for this token
            // this round" — skip it silently; the next sweep retries when the RPC recovers.
            if (res.status === 'success') {
                const value = res.result as bigint;
                results[index] = {
                    chainId: req.chainId,
                    address: req.address,
                    decimals: req.decimals,
                    formatted: formatUnits(value, req.decimals),
                    symbol: req.symbol,
                    value: value.toString(),
                }
            }
        });

        nativeResults.forEach(({index, result}) => {
            const req = requests[index];
            if (result !== null) {
                results[index] = {
                    chainId: req.chainId,
                    address: req.address,
                    decimals: req.decimals,
                    formatted: formatUnits(result, req.decimals),
                    symbol: req.symbol,
                    value: result.toString(),
                }
            }
        });

        return results;
    }

    const fetchBatch = async (initData: BalanceRequest[]) => {
        const fullLength = initData.length;
        const currentLoaded = fullResult.length;
        if (currentLoaded === fullLength) {
            setIsLoaded(true);
            return;
        }
        const slice = initData.slice(currentLoaded, currentLoaded + (batchSize === 2 ? 1 : batchSize));
        try {
            const batchResults = await fetchAllBalances(slice);
            setFullResult([...fullResult, ...batchResults]);
            const loaded = currentLoaded + batchResults.length;
            const percentage = Number((loaded * 100 / fullLength).toFixed(2));
            console.log(`Loaded ${loaded} of ${fullLength}, ${percentage}% of tokens for metamask`);
            if (loaded === fullLength) {
                setIsLoaded(true);
            }
            if (batchSize < BATCH_SIZE) {
                setBatchSize(b => Math.min(BATCH_SIZE, b * 2));
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            setBatchSize(b => Math.max(1, Math.floor(b / 2)));
            if (message !== REDUCE_BATCH_SIZE_ERROR) {
                console.log("reducing batch size because of error", message)
            }
        }
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
        if (!result) return false;
        const b = balance as AddressBalanceResult;
        const newData = {...metaMaskUserData};
        if (Number(result.value)) {
            (newData[b.address] ||= {})[b.symbol] ||= {};
            newData[b.address][b.symbol][b.chainId] = result;
        } else {
            // balance is genuinely zero now — drop the entry, same as the bulk loader's
            // non-zero filter, so the asset row disappears
            delete newData[b.address]?.[b.symbol]?.[b.chainId];
            if (newData[b.address]?.[b.symbol] && !Object.keys(newData[b.address][b.symbol]).length) {
                delete newData[b.address][b.symbol];
            }
            if (newData[b.address] && !Object.keys(newData[b.address]).length) {
                delete newData[b.address];
            }
        }
        setMetaMaskUserData(newData);
        return true;
    };

    const options = useMemo<BalanceRequest[]>(() => {
        if (!wallet || !wallet.accounts?.length) {
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
    }, [wallet])

    useEffect(() => {
        setFullResult([])
        setIsLoaded(false)
        setBatchSize(BATCH_SIZE)
    }, [wallet, metaMaskSettingsEnabled, options, loadingUserDataAllowed])

    useInterval(() => {
        if (!wallet || !wallet.accounts || !wallet.accounts.length
            || !metaMaskSettingsEnabled || !options.length
            || !loadingUserDataAllowed
        ) {
            return
        }
        fetchBatch(options).catch(e => console.warn(e))
    }, (isLoaded || !loadingUserDataAllowed || !metaMaskSettingsEnabled) ? null : REQUEST_DELAY_MS)

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
