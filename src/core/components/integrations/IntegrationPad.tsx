import React, {JSX} from "react";

interface IntegrationData {
    name: string
    logo: JSX.Element
    logoClass: string,
    onClick: () => void,
}

export default function IntegrationPad(integrationData: IntegrationData) {
    return (
        <div onClick={integrationData.onClick}
             className={"new-asset-integration flex-box-centered flex-direction-row pad layer-3-themed-color"}>
            <div className={"new-asset-integration-logo " + integrationData.logoClass} title={integrationData.name}>
                {integrationData.logo}
            </div>
        </div>
    )
}

export interface ThirdPartyIntegration {
    element: (onClick: () => void) => JSX.Element,
    name: string,
}
