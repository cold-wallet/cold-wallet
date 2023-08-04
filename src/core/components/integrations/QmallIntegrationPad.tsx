import QmallSvg from "../../../resources/images/qmallSvg";
import React from "react";
import IntegrationPad, {ThirdPartyIntegration} from "./IntegrationPad";

const name: string = "qmall";

const qmallIntegration: ThirdPartyIntegration = {
    element: (onClick: () => void) =>
        <IntegrationPad logo={<QmallSvg/>}
                        key={name}
                        logoClass={"integration-logo--qmall"}
                        name={name}
                        onClick={onClick}
        />,
    name,
}

export default qmallIntegration;
