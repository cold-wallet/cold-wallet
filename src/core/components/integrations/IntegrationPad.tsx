import './index.css';
import React, {JSX} from "react";

interface IntegrationData {
    name: string
    logo: JSX.Element
    logoClass: string,
    onClick: () => void,
    isEnabled: boolean,
}

export default function IntegrationPad(integrationData: IntegrationData) {
    return (
        <div onClick={integrationData.onClick}
             className={"integration flex-box-centered flex-direction-row pad layer-3-themed-color" +
                 (integrationData.isEnabled ? " integration-enabled" : "")}>
            <div className={"integration-logo flex-box-centered " + integrationData.logoClass}
                 title={integrationData.name}>
                {integrationData.logo}
            </div>
            {integrationData.isEnabled
                ? <div className="integration-enabled-corner">
                    <span className={"integration-enabled-corner-text"}>✔</span>
                </div>
                : null}
        </div>
    )
}

export interface ThirdPartyIntegration {
    element: (onClick: () => void, isEnabled: boolean) => JSX.Element,
    name: string,
}
