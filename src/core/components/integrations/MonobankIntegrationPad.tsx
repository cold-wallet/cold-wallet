import MonobankSvg from "../../../resources/images/monobankSvg";
import React from "react";
import IntegrationPad, {ThirdPartyIntegration} from "./IntegrationPad";

const name: string = "monobank";

const monobankIntegration: ThirdPartyIntegration = {
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
