import React from "react";
import IntegrationPad, {PartnerThirdPartyIntegration} from "../IntegrationPad";
import MetaMaskLogoSvg from "../../../../resources/images/MetaMaskIcon";

const name: string = "metamask";

export const metaMaskIntegrationPad: PartnerThirdPartyIntegration = {
    element: (onClick: () => void, isEnabled: boolean) =>
        <IntegrationPad logo={<MetaMaskLogoSvg/>}
                        key={name}
                        logoClass={"integration-logo--metamask"}
                        name={name}
                        onClick={onClick}
                        isEnabled={isEnabled}
        />,
    name,
}
