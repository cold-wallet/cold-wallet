export interface AddressBalanceResult {
    chainId: number
    address: `0x${string}`
    decimals: number
    formatted: string
    symbol: string
    value: string
    /** The token's contract (none: the chain's native coin, or a balance saved by an older version).
     *  Kept so the balance can be checked again even after the coin list stops naming it. */
    token?: `0x${string}`
}

export interface MetaMaskAccount {
    [address: string]: { [symbol: string]: { [chainId: number]: AddressBalanceResult } },
}

export interface MetaMaskWallet {
    accounts: string[],
    balance: "",
    chainId: "",
}
