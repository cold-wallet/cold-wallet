import React from 'react';
import './App.css';
import ColdWallet from "./core/components/ColdWallet";
import storageFactory from './impl/Storage';
import sessionStorageFactory from './impl/SessionStorage';

function App() {
    return (
        <ColdWallet properties={{storageFactory, sessionStorageFactory}}/>
    );
}

export default App;
