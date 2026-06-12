export default class CoinGeckoCurrencyResponse {
    constructor(
        public id: string,      // "bitcoin",
        public symbol: string,  // "btc",
        public name: string,    // "Bitcoin"
        // contract addresses per EVM chain, trimmed to scannable platforms (the MetaMask token
        // scan reads these). { "ethereum": "0x…", "polygon-pos": "0x…" }. Absent for coins with
        // no scannable on-chain address. Populated from /coins/list?include_platform=true.
        public platforms?: { [platformId: string]: string },
    ) {
    }
}
