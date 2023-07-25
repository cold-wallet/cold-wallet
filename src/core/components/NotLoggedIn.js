import React from "react";
import LogInButton from "./LogInButton";
import CreateWalletButton from "./CreateWalletButton";
import ImportWalletButton from "./ImportWalletButton";

const NotLoggedIn = (userData, setUserData) => {
    return (
        <div className={"startup-login-box layer-1-themed-color"}>
            {userData
                ? LogInButton()
                : CreateWalletButton(setUserData)}
            {ImportWalletButton()}
        </div>
    );
}

export default NotLoggedIn;
