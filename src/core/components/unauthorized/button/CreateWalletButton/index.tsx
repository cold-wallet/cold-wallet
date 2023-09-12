import '../index.css';
import React from "react";
import UserData from "../../../../domain/UserData";
import uuidGenerator from "../../../../utils/uuidGenerator";
import {initUserDataHolder} from "../../../../services/UserDataService";
import Props from "../../../Props";

export default function CreateWalletButton(props: Props) {

    const createWallet = () => {
        if (props.termsAndPolicyAgreed) {
            props.setUserDataHolder(initUserDataHolder(new UserData(uuidGenerator.generateUUID())))
            // put cookies that terms accepted
        }
    }

    return (
        <div
            onClick={createWallet}
            className={"startup-login-box-button layer-2-themed-color pad"
                + (props.termsAndPolicyAgreed ? "" : " disabled")}>
            create new wallet
        </div>
    );
}
