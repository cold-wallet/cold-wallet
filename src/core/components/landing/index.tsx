import './index.css';
import Whitepaper from '../../../resources/images/whitepaper/ColdWallet_Whitepaper.pdf';

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
                    <a className="buy-button" href="https://www.sushi.com/ethereum/pool/v3/0x79d1ad6e84819e3e9fb7f73512c49203a4037750" target="_blank" rel="noopener noreferrer">Buy on SushiSwap V3</a>
                    <a className="buy-button" href="https://www.sushi.com/ethereum/pool/v2/0xe9fb36429fa2da71ec7c7a2d50bef0939ad920bd" target="_blank" rel="noopener noreferrer">Buy on SushiSwap V2</a>
                </div>
                <p>
                    <a href={Whitepaper} target="_blank" rel="noopener noreferrer">ColdWallet Whitepaper</a>
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

