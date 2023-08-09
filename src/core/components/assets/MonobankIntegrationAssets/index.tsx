import './index.css';
import IntegrationAsset from "../IntegrationAsset";
import MonobankUserData from "../../../integrations/monobank/MonobankUserData";

export default function MonobankIntegrationAssets(monobankUserData: MonobankUserData) {
    return MonobankUserData.getAllAssets(monobankUserData).map(IntegrationAsset)
}
