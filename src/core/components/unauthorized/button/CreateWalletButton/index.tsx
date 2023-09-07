import '../index.css';
import React, {Dispatch, SetStateAction} from "react";
import UserData from "../../../../domain/UserData";
import uuidGenerator from "../../../../utils/uuidGenerator";
import UserDataHolder from "../../../../domain/UserDataHolder";
import {initUserDataHolder} from "../../../../services/UserDataService";

export default function CreateWalletButton(setUserDataHolder: Dispatch<SetStateAction<UserDataHolder>>) {

    const createWallet = () => {
        setUserDataHolder(initUserDataHolder(new UserData(uuidGenerator.generateUUID())))
    }

    return (
        <div
            onClick={createWallet}
            className={"startup-login-box-button layer-2-themed-color pad"}>
            create new wallet
        </div>
    );
}
