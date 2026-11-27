import React from 'react';
import './App.css';
import ColdWallet from "./core/components/ColdWallet";
import storageFactory from './impl/Storage';
import userDataStorageFactory from './impl/UserDataStorage';
import inMemoryStorageFactory from './web/storage/InMemoryStorageFactory';
import inMemoryUserDataStorageFactory from './web/storage/InMemoryUserDataStorageFactory';

// Remove a value left in sessionStorage by older versions.
try { window.sessionStorage?.removeItem('pinCode'); } catch { /* storage unavailable */ }

function App({ startInDemoMode = false }: { startInDemoMode?: boolean } = {}) {

    // In a demo session, user-scoped stores are ephemeral: the wallet and the injected demo
    // integration assets live only in memory, so nothing demo touches (reads or writes)
    // localStorage. Market data (prices/currencies/rates, hideAmounts) stays on localStorage
    // in every mode — it's real, shared data and caching it carries no downside.
    const properties = {
        storageFactory,
        userDataStorageFactory: startInDemoMode ? inMemoryUserDataStorageFactory : userDataStorageFactory,
        integrationUserDataStorageFactory: startInDemoMode ? inMemoryStorageFactory : storageFactory,
    };

    return (
        <ColdWallet
            properties={properties}
            startInDemoMode={startInDemoMode}
        />
    );
}

export default App;
