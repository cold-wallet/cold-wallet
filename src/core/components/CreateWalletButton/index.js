import './index.css';
import React from "react";
import UserData from "../../domain/UserData";
import uuidGenerator from "../../utils/uuidGenerator";

export default function CreateWalletButton(setUserData) {

    const createWallet = () => {
        setUserData(new UserData(uuidGenerator.generateUUID()))
    }

    return (
        <div
            onClick={createWallet}
            className={"startup-login-box-button layer-2-themed-color pad"}>
            create new wallet
        </div>
    );
}
