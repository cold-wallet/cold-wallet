import MonobankSvg from "../../../resources/images/monobankSvg";
import React from "react";
import IntegrationPad, {PartnerThirdPartyIntegration} from "./IntegrationPad";

const name: string = "monobank";

const monobankIntegration: PartnerThirdPartyIntegration = {
    element: (onClick: () => void, isEnabled: boolean) =>
        <IntegrationPad logo={<MonobankSvg/>}
                        key={name}
                        logoClass={"integration-logo--monobank"}
                        name={name}
                        onClick={onClick}
                        isEnabled={isEnabled}
        />,
    name,
}

export default monobankIntegration;
