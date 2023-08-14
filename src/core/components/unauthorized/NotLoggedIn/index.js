import './index.css';
import React from "react";
import LogInButton from "../button/LogInButton";
import CreateWalletButton from "../button/CreateWalletButton";
import ImportWalletButton from "../button/ImportWalletButton";

export default function NotLoggedIn(userData, setUserData) {
    return (
        <div className={"startup-login-box layer-1-themed-color"}>
            {userData.id
                ? LogInButton()
                : CreateWalletButton(setUserData)}
            {ImportWalletButton()}
        </div>
    );
}
