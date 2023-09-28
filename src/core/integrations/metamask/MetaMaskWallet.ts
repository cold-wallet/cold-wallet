export interface AddressBalanceResult {
    chainId: number
    address: `0x${string}`
    decimals: number
    formatted: string
    symbol: string
    value: string
}

export interface MetaMaskAccount {
    [address: string]: { [symbol: string]: { [chainId: number]: AddressBalanceResult } },
}

export interface MetaMaskWallet {
    accounts: string[],
    balance: "",
    chainId: "",
}
