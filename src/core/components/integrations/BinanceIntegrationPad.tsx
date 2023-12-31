import BinanceSvg from "../../../resources/images/binanceSvg";
import React from "react";
import IntegrationPad, {PartnerThirdPartyIntegration} from "./IntegrationPad";

const name: string = "binance";

const binanceIntegration: PartnerThirdPartyIntegration = {
    element: (onClick: () => void, isEnabled: boolean) =>
        <IntegrationPad logo={<BinanceSvg/>}
                        key={name}
                        logoClass={"integration-logo--binance"}
                        name={name}
                        onClick={onClick}
                        isEnabled={isEnabled}
        />,
    name,
}

export default binanceIntegration;
