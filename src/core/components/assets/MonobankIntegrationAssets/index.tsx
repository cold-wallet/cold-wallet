import './index.css';
import IntegrationAsset from "../IntegrationAsset";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";

export default function MonobankIntegrationAssets(monobankUserData: MonobankUserData) {
    return monobankUserData.accounts.concat(monobankUserData.jars).map(IntegrationAsset)
}