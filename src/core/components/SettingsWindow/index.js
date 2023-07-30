import './index.css';
import ModalWindow from "../ModalWindow";
import NeutralButton from "../buttons/NeutralButton";
import React from "react";
import PositiveButton from "../buttons/PositiveButton";

export default function SettingsWindow({stateReset,}) {
    function onCancelClicked() {
        stateReset()
    }

    function isNewSettingsValid() {
        return true;
    }

    function onSaveClicked() {
        if (isNewSettingsValid()) {
            stateReset()
        } else {
        }
    }

    return (
        <ModalWindow
            closeable={true}
            large={true}
            onCancel={stateReset}
            title={"Settings"}
            //children={}
            bottom={[
                <PositiveButton onClick={onSaveClicked}
                                key={"save"}
                                className="settings-window-bottom-button">Save
                </PositiveButton>,
                <NeutralButton onClick={onCancelClicked}
                               key={"cancel"}
                               className="settings-window-bottom-button">Cancel
                </NeutralButton>
            ]}
        />
    )
}
