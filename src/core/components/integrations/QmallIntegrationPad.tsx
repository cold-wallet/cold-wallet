import './index.css';
import QmallSvg from "../../../resources/images/qmallSvg";
import React from "react";
import IntegrationPad, {ThirdPartyIntegration} from "./IntegrationPad";

const name: string = "qmall";

const qmallIntegration: ThirdPartyIntegration = {
    element: (onClick: () => void, isEnabled: boolean) =>
        <IntegrationPad logo={<QmallSvg/>}
                        key={name}
                        logoClass={"integration-logo--qmall"}
                        name={name}
                        onClick={onClick}
                        isEnabled={isEnabled}
        />,
    name,
}

export default qmallIntegration;
