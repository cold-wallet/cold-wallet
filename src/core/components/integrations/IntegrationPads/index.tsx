import './index.css'
import binanceIntegration from "../BinanceIntegrationPad";
import okxIntegration from "../OkxIntegrationPad";
import monobankIntegration from "../MonobankIntegrationPad";
import Props from "../../Props";

export default function IntegrationPads(props: Props) {
    return (
        [
            {integration: binanceIntegration, isEnabled: props.binanceSettingsEnabled},
            {integration: okxIntegration, isEnabled: props.okxSettingsEnabled},
            {integration: monobankIntegration, isEnabled: props.monobankSettingsEnabled},

        ].map(({integration, isEnabled}) => integration.element(
            () => props.setIntegrationWindowNameSelected(integration.name), isEnabled)
        )
    )
}
