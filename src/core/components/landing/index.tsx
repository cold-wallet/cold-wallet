import './index.css';

export default function Landing() {
    return (
        <div className="landing">
            <section className="section">
                <h1>ColdWallet</h1>
                <p>
                    Decentralized, anonymous and free open-source financial dashboard running entirely
                    on your device.
                </p>
                <div className="buy-buttons">
                    <a className="buy-button"
                       href="https://www.sushi.com/ethereum/swap?token0=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&token1=0xa9995a928EbFa3030B86Ab62e85007e1AB7eb208"
                       target="_blank" rel="noopener noreferrer">Buy on SushiSwap</a>
                    <a className="buy-button"
                       href="https://dex.coinmarketcap.com/token/ethereum/0xa9995a928ebfa3030b86ab62e85007e1ab7eb208/"
                       target="_blank" rel="noopener noreferrer">Watch CWT trading on CoinMarketCup DEX</a>
                </div>
                <p>
                    <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer">Whitepaper</a>
                </p>
            </section>

            <section className="section">
                <h2>Why ColdWallet?</h2>
                <ul>
                    <li>Front-end as a Service (FaaS): all code runs locally on your machine.</li>
                    <li>Your data is encrypted and never leaves your device.</li>
                    <li>Integrations with MetaMask, Binance, OKX, Monobank and top exchanges via CCXT.</li>
                    <li>Manual asset entry for any currency.</li>
                    <li>Ready-to-use MVP at <a href="https://cold-wallet.app" target="_blank" rel="noopener noreferrer">cold-wallet.app</a>.</li>
                </ul>
            </section>

            <section className="section">
                <h2>CWT Token</h2>
                <p>Contract: <a href="https://etherscan.io/token/0xa9995a928EbFa3030B86Ab62e85007e1AB7eb208" target="_blank" rel="noopener noreferrer">0xa9995a928EbFa3030B86Ab62e85007e1AB7eb208</a></p>
                <p>Total supply: 1,000,000,000 CWT</p>
                <p>Utility token powering ColdWallet development and unlocking premium features with discounts when paying in CWT.</p>
            </section>

            <section className="section">
                <h2>Roadmap</h2>
                <ul>
                    <li><strong>H1 2025:</strong> MVP live and token launched on Ethereum.</li>
                    <li><strong>H2 2025:</strong> Major redesign and more wallet integrations.</li>
                    <li><strong>H1 2026:</strong> Balance history, premium features payable with CWT or discounted; AI-powered portfolio analysis and advice.</li>
                </ul>
            </section>

            <section className="section">
                <p>
                    <a href="/terms">Terms of Use</a> | <a href="/privacy-policy">Privacy Policy</a>
                </p>
            </section>
        </div>
    );
}

