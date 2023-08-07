import './index.css';
import MonobankUserDataResponse, {
    MonobankAccountResponse,
    MonobankJarResponse
} from "../../../integrations/monobank/MonobankUserDataResponse";
import fiatCurrencies from "../../../fiatCurrencies";
import AssetDTO from "../../../domain/AssetDTO";
import IntegrationAsset from "../IntegrationAsset";


function buildIntegrationAssets(assets: AssetDTO[]) {
    return assets.forEach(IntegrationAsset)
}

function extractAssetsFromMonobankAccounts(accounts: MonobankAccountResponse[]) {
    return accounts.filter(account => +account.balance)
        .map(account => {
            let fiatCurrency = fiatCurrencies.getByNumCode(account.currencyCode);
            const name = `${fiatCurrency?.code} ${account.maskedPan
                ? (account.maskedPan[0] ? (account.maskedPan[0] + " ") : "")
                : ""}${account.type}`;
            return new AssetDTO(
                "monobank_" + account.id,
                fiatCurrency?.code || "",
                String(account.balance / 100),
                name,
                fiatCurrency?.afterDecimalPoint || 2,
                false,
                true,
            )
        })
}

function extractAssetsFromMonobankJars(jars: MonobankJarResponse[]) {
    return jars.filter(jar => +jar.balance)
        .map(jar => {
            let fiatCurrency = fiatCurrencies.getByNumCode(jar.currencyCode);
            const name = `${fiatCurrency?.code} ${jar.title}`;
            return new AssetDTO(
                "monobank_jar_" + jar.id,
                fiatCurrency?.code || "",
                String(jar.balance / 100),
                name,
                fiatCurrency?.afterDecimalPoint || 2,
                false,
                true,
            )
        })
}

export default function MonobankIntegrationAssets(monobankUserData: MonobankUserDataResponse) {
    let accounts = extractAssetsFromMonobankAccounts(monobankUserData.accounts);
    let jars = extractAssetsFromMonobankJars(monobankUserData.jars);
    return accounts.concat(jars).map(IntegrationAsset)
}