import './index.css';
import OkxLogo from "../../../resources/images/okx_logo_full.png";
import React from "react";
import IntegrationPad, {PartnerThirdPartyIntegration} from "./IntegrationPad";

const name: string = "okx";

const okxIntegration: PartnerThirdPartyIntegration = {
    element: (onClick: () => void, isEnabled: boolean) =>
        <IntegrationPad logo={<img className={"okx-integration-logo"} src={OkxLogo} alt={name}/>}
                        key={name}
                        logoClass={"integration-logo--okx"}
                        name={name}
                        onClick={onClick}
                        isEnabled={isEnabled}
        />,
    name,
    oldNames: ["okex", "okex5"],
}

export default okxIntegration;
