import MonobankSvg from "../../../resources/images/monobankSvg";
import React from "react";
import IntegrationPad, {ThirdPartyIntegration} from "./IntegrationPad";

const name: string = "monobank";

const monobankIntegration: ThirdPartyIntegration = {
    element: (onClick: () => void) =>
        <IntegrationPad logo={<MonobankSvg/>}
                        key={name}
                        logoClass={"integration-logo--monobank"}
                        name={name}
                        onClick={onClick}
        />,
    name,
}

export default monobankIntegration;
