import React, { useEffect } from 'react';
import './App.css';
import ColdWallet from "./core/components/ColdWallet";
import storageFactory from './impl/Storage';
import sessionStorageFactory from './impl/SessionStorage';
import userDataStorageFactory from './impl/UserDataStorage';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './wagmiConfig';
import TagManager from 'react-gtm-module';

function App() {

    useEffect(() => {
        TagManager.initialize({
            gtmId: 'G-2CWGTRX202'
        });
    }, []);

    return (
        <WagmiProvider config={wagmiConfig}>
            <ColdWallet properties={{ storageFactory, sessionStorageFactory, userDataStorageFactory }} />
        </WagmiProvider>
    );
}

export default App;
