import '../index.css';
import React, {Dispatch, SetStateAction} from "react";

export default function ImportWalletButton(
    setImportOrExportSettingRequested: Dispatch<SetStateAction<string | null>>,
) {
    return (
        <div
            className={"startup-login-box-button layer-2-themed-color pad"}
            onClick={() => setImportOrExportSettingRequested('import')}>
            import
        </div>
    );
}
