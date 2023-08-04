import binanceIntegration from "./BinanceIntegrationPad";
import qmallIntegration from "./QmallIntegrationPad";
import monobankIntegration from "./MonobankIntegrationPad";
import {ThirdPartyIntegration} from "./IntegrationPad";

const thirdPartyIntegrations: ThirdPartyIntegration[] = [
    binanceIntegration,
    qmallIntegration,
    monobankIntegration,
];

export default thirdPartyIntegrations;
