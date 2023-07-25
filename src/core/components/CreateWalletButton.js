import React from "react";

const CreateWalletButton = (setUserData) => {

    const createWallet = () => {
        setUserData({})
    }

    return (
        <div
            onClick={createWallet}
            className={"startup-login-box-button layer-2-themed-color button"}>
            create new wallet
        </div>
    );
}

export default CreateWalletButton;
