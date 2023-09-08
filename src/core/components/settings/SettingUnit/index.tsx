import './index.css'
import React, {JSX} from "react";

export default function SettingUnit(
    onGoBack: () => void,
    children: JSX.Element,
    settingClassName?: string,
) {
    return (
        <div className={"setting-unit flex-box flex-direction-column " + settingClassName}>
            <div className="settings-go-back-row text-label pad layer-3-themed-color"
                 onClick={onGoBack}>
                {"<< Go back"}
            </div>
            {children}
        </div>
    )
}
