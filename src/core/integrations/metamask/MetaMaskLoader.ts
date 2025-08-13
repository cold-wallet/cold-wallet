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
import {chainIdToName} from "./MetaMaskChains";
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

const IGNORED_ERROR_MESSAGES = [
    "Internal error",
    "Missing or invalid parameters",
    "Failed to fetch",
    "The contract function",
    "API key is not allowed to access blockchain",
    "Invalid chain",
    "Chain not configured",
    "Requested resource not found"
];

const BATCH_SIZE = 10;
const REQUEST_DELAY_MS = 2000;

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
        const tokenOptions = ((defaultTokens.tokens || []) as Token[])
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
            const chainName = chainIdToName[balance.chainId] || balance.chainId
            const name = `${balance.symbol} ${chainName} ${balance.address}`
            const id = `metamask ${name}`;
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
        // try {
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
            tokenResults = !contracts.length ? []
                : await readContracts(wagmiConfig, {contracts, allowFailure: true});
        } catch (e) {
            console.warn("Error fetching token balances", e)
            if (requests.length === 1) {
                return [null];
            }
            throw new Error(REDUCE_BATCH_SIZE_ERROR);
        }

            const nativePromises = (requests.map((req, index) => {
                if (req.token) return null;
                console.log("address requested", req.symbol)
                const client = getPublicClient(wagmiConfig, {chainId: req.chainId});
                if (!client) return Promise.resolve({index, result: null});
                return client.getBalance({address: req.address})
                    .then(r => {
                        console.log("address found", req.symbol)
                        return r
                    })
                    .then(result => ({index, result}))
                    .catch(e => {
                        const message = e instanceof Error ? e.message : String(e);
                        if (IGNORED_ERROR_MESSAGES.some(m => message.includes(m))) {
                            console.log("address failed normally", req.symbol)
                            return {index, result: null};
                        }
                        console.log("address failed unexpected", req.symbol)
                        throw e;
                    });
            }).filter(Boolean)) as Promise<{ index: number, result: bigint | null }>[];

            const nativeResults = await Promise.all(nativePromises);

            const results: Array<AddressBalanceResult | null> = new Array(requests.length).fill(null);

            tokenResults.forEach((res, idx) => {
                const {req, index} = tokenRequests[idx];
                if (res.status === 'success') {
                    console.log("token found", req.symbol)
                    const value = res.result as bigint;
                    results[index] = {
                        chainId: req.chainId,
                        address: req.address,
                        decimals: req.decimals,
                        formatted: formatUnits(value, req.decimals),
                        symbol: req.symbol,
                        value: value.toString(),
                    }
                } else if (res.status === 'failure') {
                    const message = res.error instanceof Error ? res.error.message : String(res.error);
                    if (!IGNORED_ERROR_MESSAGES.some(m => message.includes(m))) {
                        console.log("token failed unexpectedly", req.symbol)
                        throw new Error(message);
                    }
                    console.log("token failed normally", req.symbol)
                } else {
                    console.log("empty result for ", req.symbol, req, res)
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
        // } catch (e) {
        //     if (requests.length === 1) {
        //         const message = e instanceof Error ? e.message : String(e);
        //         if (IGNORED_ERROR_MESSAGES.some(m => message.includes(m))) {
        //             return new Array(requests.length).fill(null);
        //         }
        //     }
        //     throw e;
        // }
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
            // if (!IGNORED_ERROR_MESSAGES.some(m => message.includes(m))) {
                setBatchSize(b => Math.max(1, Math.floor(b / 2)));
            if (message !== REDUCE_BATCH_SIZE_ERROR) {
                console.log("reducing batch size because of error", message)
            }
            // }
        }
    }

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
