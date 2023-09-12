import '../index.css';
import React from "react";
import Props from "../../../Props";

export default function ImportWalletButton(
    props: Props
) {
    return (
        <div
            className={"startup-login-box-button layer-2-themed-color pad"
                + (props.termsAndPolicyAgreed ? "" : " disabled")}
            onClick={() => {
                if (props.termsAndPolicyAgreed) {
                    props.setImportOrExportSettingRequested('import')
                }
            }}>
            import
        </div>
    );
}
