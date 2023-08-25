import React from 'react';
import './App.css';
import ColdWallet from "./core/components/ColdWallet";
import storageFactory from './impl/Storage';

function App() {
    return (
        <ColdWallet props={{storageFactory}}/>
    );
}

export default App;
