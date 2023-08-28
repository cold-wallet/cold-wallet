import binanceIntegration from "./BinanceIntegrationPad";
import okxIntegration from "./OkxIntegrationPad";
import monobankIntegration from "./MonobankIntegrationPad";
import {ThirdPartyIntegration} from "./IntegrationPad";

const thirdPartyIntegrations: ThirdPartyIntegration[] = [
    binanceIntegration,
    okxIntegration,
    monobankIntegration,
];

export default thirdPartyIntegrations;
