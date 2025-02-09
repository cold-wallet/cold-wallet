import {useEffect, useMemo, useState} from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import UserData from "../../domain/UserData";
import {AddressBalanceResult, MetaMaskAccount, MetaMaskWallet} from "./MetaMaskWallet";
import {fetchBalance, FetchBalanceResult} from "@wagmi/core";
import defaultTokens from "@uniswap/default-token-list"
import erc20top100 from "./../../../resources/erc20top100_2023.json"
import useInterval from "../../utils/useInterval";
import StorageFactory from "../../domain/StorageFactory";
import AssetDTO, {crypto} from "../../domain/AssetDTO";
import {chainIdToName} from "./MetaMaskChains";
import BinanceCurrencyResponse from "../binance/BinanceCurrencyResponse";

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
    token: `0x${string}`
    chainId: number
    symbol: string
    address: `0x${string}`
}

export default function MetaMaskLoader(
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
        } as BalanceRequest)
        const tokenOptions = ((defaultTokens.tokens || []) as Token[])
            .sort((a, b) => {
                const numberA = (erc20top100.indexOf(a.symbol) + 1) || 100;
                const numberB = (erc20top100.indexOf(b.symbol) + 1) || 100;
                return (numberA - numberB) || -1
            })
            .map(tokenToOption)
        const optionEth = {
            address, chainId: 1, symbol: "ETH",
        } as BalanceRequest;
        return [optionEth, ...tokenOptions]
    }
    const [fullResult, setFullResult] = useState<Array<AddressBalanceResult | null>>([])
    const [isLoaded, setIsLoaded] = useState(false)

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

    const fetch = async (
        initData: BalanceRequest[],
        fetcher: (r: BalanceRequest) => Promise<FetchBalanceResult | null>,
    ) => {
        const fullLength = initData.length;
        const currentLoaded = fullResult.length;
        if (currentLoaded === fullLength) {
            setIsLoaded(true)
            return
        }
        const request = initData.at(currentLoaded);
        if (!request) {
            console.warn(`no element at {} in {}`, currentLoaded, initData)
            return
        }
        let newResult: AddressBalanceResult | null;
        try {
            const spreadElements = await fetcher(request);
            newResult = (spreadElements) ? {
                ...spreadElements,
                value: spreadElements.value.toString(),
                address: request.address,
                chainId: request.chainId,
                symbol: request.symbol,
            } : null
            if (newResult && Uint8Array.from(newResult.symbol, e => e.charCodeAt(0))
                .reduce((a, b) => a + b) == 2
            ) {// value 2 received in an empirical way
                console.warn("strange result", newResult)
                newResult = null
            }
        } catch (e: any) {
            console.warn(e)
            newResult = null
        }

        if (currentLoaded === fullLength) {
            setIsLoaded(true)
        }
        setFullResult([
            ...fullResult,
            newResult
        ])
        const percentage = Number(Number(fullResult.length * 100 / initData.length).toFixed(2));
        console.log(`Loaded ${fullResult.length} of ${initData.length}, ${percentage}% of tokens for metamask`)
    }

    const options = useMemo<BalanceRequest[]>(() => {
        if (!wallet || !wallet.accounts?.length) {
            return []
        }
        return getAllOptions(wallet.accounts[0])
    }, [wallet])

    useInterval(() => {
        if (!wallet || !wallet.accounts || !wallet.accounts.length
            || !metaMaskSettingsEnabled || !options.length
        ) {
            return
        }
        fetch(
            options,
            ({address, chainId, token}) => {
                try {
                    return fetchBalance({
                        address, chainId, token,
                    })
                } catch (e: any) {
                    console.warn(e)
                    return Promise.resolve(null)
                }
            },
        ).catch(console.error)
    }, (isLoaded || !loadingUserDataAllowed || !metaMaskSettingsEnabled) ? null : 600)

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
