import './index.css';
import React from "react";

export default function ImportWalletButton(
    setImportOrExportSettingRequested,
) {
    return (
        <div
            className={"startup-login-box-button layer-2-themed-color pad"}
            onClick={() => setImportOrExportSettingRequested('import')}>
            import
        </div>
    );
}
