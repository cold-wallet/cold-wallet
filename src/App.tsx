import React, {useEffect} from 'react';
import './App.css';
import ColdWallet from "./core/components/ColdWallet";
import storageFactory from './impl/Storage';
import sessionStorageFactory from './impl/SessionStorage';
import {configureChains, createConfig, WagmiConfig} from 'wagmi'
import {publicProvider} from 'wagmi/providers/public'
import {InjectedConnector} from "@wagmi/core";
import {metaMaskChains} from "./core/integrations/metamask/MetaMaskChains";
import TagManager from 'react-gtm-module';

function App() {

    const {chains, publicClient, webSocketPublicClient} = configureChains(
        metaMaskChains,
        [publicProvider()],
    )
    const config = createConfig({
        autoConnect: true,
        connectors: [new InjectedConnector({chains})],
        publicClient,
        webSocketPublicClient,
        // storage: createStorage({ storage: window.localStorage }),
    })

    useEffect(() => {
        TagManager.initialize({
            gtmId: 'G-2CWGTRX202'
        });
    }, []);

    return (
        <WagmiConfig config={config}>
            <ColdWallet properties={{storageFactory, sessionStorageFactory}}/>
        </WagmiConfig>
    );
}

export default App;
