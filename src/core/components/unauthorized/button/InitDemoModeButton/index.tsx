import '../index.css';
import React from "react";
import Props from "../../../Props";
import {initUserDataHolder} from "../../../../services/UserDataService";
import UserData from "../../../../domain/UserData";
import uuidGenerator from "../../../../utils/uuidGenerator";
import {createDemoAssets, createDemoUserSettings} from "../../../../utils/DemoAssetsGenerator";

export default function InitDemoModeButton(props: Props) {

    const enableDemoMode = () => {
        const id = uuidGenerator.generateUUID();
        const userData = new UserData(
            id,
            createDemoUserSettings(),
            createDemoAssets()
        );
        props.setUserDataHolder(initUserDataHolder(userData, true))
    }

    return (
        <div
            onClick={enableDemoMode}
            className={"startup-login-box-button layer-2-themed-color pad"}>
            demo
        </div>
    );
}


