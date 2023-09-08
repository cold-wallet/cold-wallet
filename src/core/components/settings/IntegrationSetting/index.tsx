import './index.css'
import Props from "../../Props";
import React, {Dispatch, JSX, SetStateAction} from "react";
import SettingUnit from "../SettingUnit";

export interface SettingInputData {
    settingName: string,
    isInvalid: boolean,
    setIsInvalid: Dispatch<SetStateAction<boolean>>,
    setValue: Dispatch<SetStateAction<string | null>>,
    defaultValue: string | null,
}

export default function IntegrationSetting(
    props: Props,
    settingEnabled: boolean,
    integrationName: string,
    setSettingEnabled: Dispatch<SetStateAction<boolean>>,
    userDataLoadingInProgress: boolean,
    settingInputsData: SettingInputData[],
    integrationInfo?: JSX.Element,
) {
    return SettingUnit(
        () => props.setIntegrationWindowNameSelected(null),
        <>
            <div className="settings-checkbox-row">
                <label className="text-label clickable"><input
                    type="checkbox"
                    defaultChecked={settingEnabled}
                    onChange={event =>
                        setSettingEnabled(event.target.checked)
                    }
                />&nbsp;<span>Enable {integrationName} integration</span></label>
            </div>
            <div className="setting-box layer-3-themed-color flex-box flex-direction-column">
                {
                    settingInputsData.map((setting, i) => (
                        <div key={i} className={"setting-row flex-box-centered flex-direction-row"}>
                            <input type="text"
                                   disabled={!settingEnabled}
                                   placeholder={`${integrationName} ${setting.settingName}`}
                                   className={"setting-token-input" + (setting.isInvalid ? " invalid" : "")}
                                   onChange={event => {
                                       setting.setValue(event.target.value)
                                       setting.setIsInvalid(false)
                                   }}
                                   defaultValue={setting.defaultValue || ""}
                            />
                        </div>
                    ))
                }
                {userDataLoadingInProgress ? <progress className={"setting-row-progress"}/> : null}
                {integrationInfo || null}
            </div>
        </>
    )
}
