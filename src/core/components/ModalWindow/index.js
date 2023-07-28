import './index.css';
import React from "react";
import NeutralButton from "../buttons/NeutralButton";

export default function ModalWindow({onCancel, closeable, children, title, bottom, large,}) {
    return (
        <div className="modal-window-box">
            <div onClick={onCancel}
                 className={"modal-window-shadow" + (closeable ? " clickable" : "")}/>
            <div className={"modal-window modal-window-" + (large ? "large" : "small") + " flex-box" +
                " flex-direction-column layer-2-themed-color"}>
                <div className={"modal-window-header modal-window-header-" + (large ? "large" : "small")
                    + " flex-box" + (closeable ? "" : " modal-window-header-centered") +
                    " flex-direction-row layer-1-themed-color"}>
                    {title}
                    {closeable ? <NeutralButton className={"modal-window-close-button"}
                                                onClick={onCancel}
                    >✖</NeutralButton> : null}
                </div>
                {children}
                {bottom}
            </div>
        </div>
    )
}
