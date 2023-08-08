import './index.css';
import React from "react";
import NeutralButton from "../buttons/NeutralButton";

export default function ModalWindow({closeable, large, onCancel, children, title, bottom,}) {
    const sizeSuffix = large ? "large" : "small";
    const onClickClose = () => {
        if (closeable) {
            onCancel()
        }
    };
    return (
        <div className="modal-window-box">
            <div onClick={onClickClose}
                 className={"modal-window-shadow" + (closeable ? " clickable" : "")}/>
            <div className={"modal-window modal-window-" + sizeSuffix + " flex-box" +
                " flex-direction-column layer-2-themed-color"}>
                <div className={"modal-window-header modal-window-header-" + sizeSuffix
                    + " flex-box" + (closeable ? "" : " modal-window-header-centered") +
                    " flex-direction-row layer-1-themed-color"}>
                    {title
                        ? <div className="modal-window-title text-label flex-box-centered">{title}</div>
                        : null
                    }
                    {closeable ? <NeutralButton className={"modal-window-close-button"}
                                                onClick={onCancel}
                    >✖</NeutralButton> : null}
                </div>
                {children}
                {bottom
                    ? <div className={"modal-window-bottom-" + sizeSuffix
                        + " flex-box-centered flex-direction-row layer-1-themed-color"}
                    >{bottom}</div>
                    : null}
            </div>
        </div>
    )
}
