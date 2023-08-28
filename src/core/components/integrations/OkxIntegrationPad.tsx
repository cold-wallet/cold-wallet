import './index.css';
import OkxLogo from "../../../resources/images/okx_logo_full.png";
import React from "react";
import IntegrationPad, {ThirdPartyIntegration} from "./IntegrationPad";

const name: string = "okx";

const okxIntegration: ThirdPartyIntegration = {
    element: (onClick: () => void, isEnabled: boolean) =>
        <IntegrationPad logo={<img src={OkxLogo} alt={name}/>}
                        key={name}
                        logoClass={"integration-logo--okx"}
                        name={name}
                        onClick={onClick}
                        isEnabled={isEnabled}
        />,
    name,
}

export default okxIntegration;
