import './index.css';
import React from "react";

export default function CreateWalletButton(setUserData) {

    const createWallet = () => {
        setUserData({})
    }

    return (
        <div
            onClick={createWallet}
            className={"startup-login-box-button layer-2-themed-color pad"}>
            create new wallet
        </div>
    );
}
