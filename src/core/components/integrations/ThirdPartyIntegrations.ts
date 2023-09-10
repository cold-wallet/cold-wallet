import binanceIntegration from "./BinanceIntegrationPad";
import okxIntegration from "./OkxIntegrationPad";
import monobankIntegration from "./MonobankIntegrationPad";
import {ThirdPartyIntegration} from "./IntegrationPad";
import ccxtConnector from "../../integrations/ccxt/ccxtConnector";

export const partnerIntegrations = [
    binanceIntegration,
    okxIntegration,
    monobankIntegration,
];

const integrations: ThirdPartyIntegration[] = ccxtConnector.getExchanges()
    .filter(exchangeName => !partnerIntegrations.find(integration =>
        integration.name === exchangeName
        || integration.oldNames?.find(oldName => oldName === exchangeName)))
    .map(exchangeName => ({
        name: exchangeName,
    } as ThirdPartyIntegration));

const thirdPartyIntegrations: ThirdPartyIntegration[] = [
    ...partnerIntegrations,
    ...integrations,
];

export default thirdPartyIntegrations;
