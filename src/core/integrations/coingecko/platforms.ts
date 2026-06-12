// CoinGecko `asset_platform` id → numeric EVM chain id, for the chains the MetaMask scanner
// queries. CoinGecko's /coins/list?include_platform=true returns contract addresses keyed by
// these platform ids; we keep only the ones listed here (EVM mainnets) and drop the rest
// (Solana/Tron/TON/Sui/Aptos/testnets…) both when storing the currency map and when scanning.
const PLATFORM_CHAINID: { [platform: string]: number } = {
    "ethereum": 1,
    "optimistic-ethereum": 10,
    "cronos": 25,
    "binance-smart-chain": 56,
    "gnosis": 100,
    "xdai": 100, // legacy alias for Gnosis Chain seen in some entries
    "unichain": 130,
    "polygon-pos": 137,
    "fantom": 250,
    "base": 8453,
    "arbitrum-one": 42161,
    "avalanche": 43114,
    "celo": 42220,
};

export default PLATFORM_CHAINID;
