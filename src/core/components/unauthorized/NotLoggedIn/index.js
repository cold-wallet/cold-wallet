import './index.css';
import React from "react";
import LogInButton from "../LogInButton";
import CreateWalletButton from "../CreateWalletButton";
import ImportWalletButton from "../ImportWalletButton";

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
