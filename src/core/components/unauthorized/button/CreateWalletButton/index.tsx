import '../index.css';
import React, {Dispatch, SetStateAction} from "react";
import UserData from "../../../../domain/UserData";
import uuidGenerator from "../../../../utils/uuidGenerator";

export default function CreateWalletButton(setUserData: Dispatch<SetStateAction<UserData>>) {

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
