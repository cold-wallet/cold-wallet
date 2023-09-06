import './index.css';
import React, {JSX} from "react";
import ModalWindow from "./../../ModalWindow";
import PositiveButton from "./../../buttons/PositiveButton";
import NeutralButton from "./../../buttons/NeutralButton";
import monobankIntegration from "./../../integrations/MonobankIntegrationPad";
import MonobankSettings from "./.././MonobankSettings";
import binanceIntegration from "./../../integrations/BinanceIntegrationPad";
import BinanceSettings from "./.././BinanceSettings";
import okxIntegration from "./../../integrations/OkxIntegrationPad";
import OkxSettings from "../OkxSettings";
import monobankSettingsValidation from "./.././MonobankSettings/monobankSettingsValidation";
import binanceSettingsValidation from "./.././BinanceSettings/binanceSettingsValidation";
import okxSettingsValidation from "../OkxSettings/okxSettingsValidation";
import Props from "../../Props";

export default function IntegrationSettings(
    defaultViewBuilder: () => JSX.Element,
    closeable: boolean,
    large: boolean,
    title: string,
    onClose: () => void,
    withBottom: boolean,
    props: Props,
) {

    function onSaveClicked() {
        switch (props.integrationWindowNameSelected) {
            case monobankIntegration.name:
                return monobankSettingsValidation(props)
            case binanceIntegration.name:
                return binanceSettingsValidation(props)
            case okxIntegration.name:
                return okxSettingsValidation(props)
            default:
                props.stateReset()
        }
    }

    function buildWindowContent() {
        switch (props.integrationWindowNameSelected) {
            case monobankIntegration.name:
                return MonobankSettings(props)
            case binanceIntegration.name:
                return BinanceSettings(props)
            case okxIntegration.name:
                return OkxSettings(props)
            default:
                return defaultViewBuilder()
        }
    }

    return (
        <ModalWindow
            closeable={closeable}
            large={large}
            onCancel={onClose}
            title={title}
            children={
                <div className="settings-box">{buildWindowContent()}</div>
            }
            bottom={withBottom ? <>
                <PositiveButton onClick={onSaveClicked}
                                className="settings-window-bottom-button">Save
                </PositiveButton>
                <NeutralButton onClick={onClose}
                               className="settings-window-bottom-button">Cancel
                </NeutralButton>
            </> : null}
        />
    )
}
