import React, {useEffect, useMemo, useState} from 'react';
import BinanceLoader from "./../integrations/binance/BinanceLoader";
import MonobankLoader from "./../integrations/monobank/MonobankLoader";
import NotLoggedIn from "./unauthorized/NotLoggedIn";
import AssetsDashboard from "./AssetsDashboard";
import StorageFactory from "../domain/StorageFactory";
import {AccountInfo} from "../integrations/binance/binanceApiClient";
import MonobankUserData from "../integrations/monobank/MonobankUserData";
import PinCodeOnLogin from "./unauthorized/PinCodeOnLogin";
import OkxLoader from "../integrations/okx/OkxLoader";
import {OkxAccount} from "../integrations/okx/okxApiClient";
import UserDataService from "../services/UserDataService";
import UserData from "../domain/UserData";
import CoinGeckoLoader from "../integrations/coingecko/CoinGeckoLoader";
import AssetDTO from "../domain/AssetDTO";
import OnStartupLoader from "./OnStartupLoader";
import Props from "./Props";
import CcxtLoader from "../integrations/ccxt/CcxtLoader";
import {CurrencyService} from "../services/CurrencyService";
import {compareStringsIgnoreCase} from "../utils/compareStrings";
import Option from "./integrations/SelectIntegration/Option";
import PriceService from "../services/PriceService";

export default function ColdWallet(
    {properties}: {
        properties: {
            storageFactory: StorageFactory,
            sessionStorageFactory: StorageFactory,
        },
    }
) {
    const [termsAndPolicyAgreed, setTermsAndPolicyAgreed] = useState<boolean>(false);

    const [
        pinCode,
        setPinCode
    ] = properties.sessionStorageFactory.createStorageNullable<string>("pinCode");
    const [pinCodeEntered, setPinCodeEntered] = useState<string | null>(null);
    const {
        userData, setUserData,
        userDataHolder, setUserDataHolder,
        shouldEnterPinCode,
        loggedIn,
    } = UserDataService({
        storageFactory: properties.storageFactory,
        pinCode,
    });

    const {
        coinGeckoPrices, coinGeckoPricesLoaded,
        coinGeckoCurrencies, coinGeckoCurrenciesLoaded,
    } = CoinGeckoLoader(properties.storageFactory)

    const loadingUserDataAllowed = !shouldEnterPinCode;
    const {
        binancePrices, binancePricesLoaded,
        binanceCurrencies, binanceCurrenciesLoaded,
        binanceUserData, setBinanceUserData,
        loadBinanceUserData,
    } = BinanceLoader(
        loadingUserDataAllowed,
        properties.storageFactory,
        userData.settings.binanceIntegrationEnabled,
        userData.settings.binanceIntegrationApiKey,
        userData.settings.binanceIntegrationApiSecret,
    );
    const {
        okxPrices, okxPricesLoaded,
        okxCurrencies, okxCurrenciesLoaded,
        okxUserData, setOkxUserData,
        loadOkxUserData,
    } = OkxLoader(
        loadingUserDataAllowed,
        properties.storageFactory,
        userData.settings.okxIntegrationEnabled,
        userData.settings.okxIntegrationApiKey,
        userData.settings.okxIntegrationApiSecret,
        userData.settings.okxIntegrationPassPhrase,
        userData.settings.okxIntegrationSubAccountName,
    );
    const {
        monobankRates,
        monobankCurrencies,
        monobankUserData,
        setMonobankUserData,
        loadMonobankUserData,
    } = MonobankLoader(
        loadingUserDataAllowed,
        properties.storageFactory,
        userData.settings.monobankIntegrationEnabled,
        userData.settings.monobankIntegrationToken
    );

    const {loaded} = OnStartupLoader(
        binancePricesLoaded,
        binanceCurrenciesLoaded,
        okxPricesLoaded,
        okxCurrenciesLoaded,
        coinGeckoPricesLoaded,
        coinGeckoCurrenciesLoaded,
        monobankRates,
        monobankCurrencies,
    );

    const [newAssetCurrency, setNewAssetCurrency] = useState<string | null>(null);
    const [newAssetAmount, setNewAssetAmount] = useState<string | null>(null);
    const [newAssetName, setNewAssetName] = useState<string | null>(null);
    const [isNewAssetAmountInvalid, setIsNewAssetAmountInvalid] = useState(false);
    const [isNewAssetNameInvalid, setIsNewAssetNameInvalid] = useState(false);
    const [assetToDelete, setAssetToDelete] = useState<AssetDTO | null>(null);
    const [assetToEdit, setAssetToEdit] = useState<AssetDTO | null>(null);
    const [showConfigsWindow, setShowConfigsWindow] = useState(false);
    const [monobankSettingsEnabled, setMonobankSettingsEnabled] = useState(
        userData.settings.monobankIntegrationEnabled
    );
    const [monobankApiTokenInput, setMonobankApiTokenInput] = useState(
        userData.settings.monobankIntegrationToken
    );
    const [monobankApiTokenInputInvalid, setMonobankApiTokenInputInvalid] = useState(false);
    const [monobankUserDataLoading, setMonobankUserDataLoading] = useState(false);
    const [integrationWindowNameSelected, setIntegrationWindowNameSelected] = useState<string | null>(null);


    const [binanceSettingsEnabled, setBinanceSettingsEnabled] = useState(
        userData.settings.binanceIntegrationEnabled
    );
    const [binanceApiKeyInput, setBinanceApiKeyInput] = useState(
        userData.settings.binanceIntegrationApiKey
    );
    const [binanceApiSecretInput, setBinanceApiSecretInput] = useState(
        userData.settings.binanceIntegrationApiSecret
    );
    const [binanceApiKeysInputInvalid, setBinanceApiKeysInputInvalid] = useState(false);
    const [binanceUserDataLoading, setBinanceUserDataLoading] = useState(false);

    const [okxSettingsEnabled, setOkxSettingsEnabled] = useState(
        userData.settings.okxIntegrationEnabled
    );
    const [okxApiKeyInput, setOkxApiKeyInput] = useState(
        userData.settings.okxIntegrationApiKey
    );
    const [okxApiSecretInput, setOkxApiSecretInput] = useState(
        userData.settings.okxIntegrationApiSecret
    );
    const [okxApiPassPhraseInput, setOkxApiPassPhraseInput] = useState(
        userData.settings.okxIntegrationPassPhrase
    );
    const [okxApiSubAccountNameInput, setOkxApiSubAccountNameInput] = useState(
        userData.settings.okxIntegrationSubAccountName
    );
    const [okxApiKeysInputInvalid, setOkxApiKeysInputInvalid] = useState(false);
    const [okxUserDataLoading, setOkxUserDataLoading] = useState(false);
    const [currentSettingInputsInvalid, setCurrentSettingInputsInvalid] = useState(false);

    const {
        ccxtUserData, setCcxtUserData,
        enabledCcxtIntegrations, setEnabledCcxtIntegrations,
        getEnabledCcxtIntegrations,
    } = CcxtLoader(loadingUserDataAllowed, properties.storageFactory, userData)

    const [loadingUserDataFromResource, setLoadingUserDataFromResource] = useState<string | null>(null);
    const [currentIntegrationApiKey, setCurrentIntegrationApiKey] = useState<string | null>(null);
    const [currentIntegrationApiSecret, setCurrentIntegrationApiSecret] = useState<string | null>(null);
    const [currentIntegrationApiPassword, setCurrentIntegrationApiPassword] = useState<string | null>(null);
    const [currentIntegrationApiAdditionalSetting, setCurrentIntegrationApiAdditionalSetting] = useState<string | null>(null);

    function getAnyAssetExist(
        userData: UserData,
        binanceUserData: AccountInfo | null,
        okxUserData: OkxAccount | null,
        monobankUserData: MonobankUserData | null,
    ) {
        return !!(userData.assets.length)
            || (userData.settings.binanceIntegrationEnabled && AccountInfo.assetsExist(binanceUserData))
            || (userData.settings.okxIntegrationEnabled && OkxAccount.assetsExist(okxUserData))
            || (userData.settings.monobankIntegrationEnabled && MonobankUserData.assetsExist(monobankUserData))
    }

    const anyAssetExist = useMemo(
        () => getAnyAssetExist(userData, binanceUserData, okxUserData, monobankUserData,),
        [userData, binanceUserData, okxUserData, monobankUserData,]
    )
    const [showCreateNewAssetWindow, setShowCreateNewAssetWindow]
        = useState(!anyAssetExist && loggedIn);
    useEffect(() => setShowCreateNewAssetWindow(!anyAssetExist && loggedIn),
        [anyAssetExist, loggedIn]);

    const [creatingNewAsset, setCreatingNewAsset] = useState(!anyAssetExist && loggedIn);
    useEffect(() => setCreatingNewAsset(!anyAssetExist && loggedIn),
        [anyAssetExist, loggedIn]);

    const [selectedPageNumber, setSelectedPageNumber] = useState(0);
    const [firstPageChartView, setFirstPageChartView] = useState('pie');

    const [importOrExportSettingRequested, setImportOrExportSettingRequested] = useState<string | null>(null);
    const [importDataBuffer, setImportDataBuffer] = useState<string | null>(null);

    const [pinCodeSettingsRequested, setPinCodeSettingsRequested] = useState(false);
    const [pinCodeEnteringFinished, setPinCodeEnteringFinished] = useState(false);
    const [currentPinCodeConfirmed, setCurrentPinCodeConfirmed] = useState(false);
    const [pinCodeRepeatEntered, setPinCodeRepeatEntered] = useState<string | null>(null);
    const [invalidPinCode, setInvalidPinCode] = useState(false);

    const [deletePinCodeRequested, setDeletePinCodeRequested] = useState(false);

    function stateReset() {
        setShowCreateNewAssetWindow(!getAnyAssetExist(userData, binanceUserData, okxUserData, monobankUserData,));
        setCreatingNewAsset(!getAnyAssetExist(userData, binanceUserData, okxUserData, monobankUserData,));
        setNewAssetCurrency(null);
        setNewAssetAmount(null);
        setNewAssetName(null);
        setIsNewAssetAmountInvalid(false);
        setIsNewAssetNameInvalid(false);
        setAssetToDelete(null);
        setAssetToEdit(null);
        setShowConfigsWindow(false);
        setIntegrationWindowNameSelected(null);

        setMonobankSettingsEnabled(userData.settings.monobankIntegrationEnabled);
        setMonobankApiTokenInput(userData.settings.monobankIntegrationToken);
        setMonobankApiTokenInputInvalid(false);
        setMonobankUserDataLoading(false);

        setBinanceSettingsEnabled(userData.settings.binanceIntegrationEnabled);
        setBinanceApiKeyInput(userData.settings.binanceIntegrationApiKey);
        setBinanceApiSecretInput(userData.settings.binanceIntegrationApiSecret);
        setBinanceApiKeysInputInvalid(false);
        setBinanceUserDataLoading(false);

        setOkxSettingsEnabled(userData.settings.okxIntegrationEnabled)
        setOkxApiKeyInput(userData.settings.okxIntegrationApiKey)
        setOkxApiSecretInput(userData.settings.okxIntegrationApiSecret)
        setOkxApiPassPhraseInput(userData.settings.okxIntegrationPassPhrase)
        setOkxApiSubAccountNameInput(userData.settings.okxIntegrationSubAccountName)
        setOkxApiKeysInputInvalid(false)
        setOkxUserDataLoading(false)

        setImportOrExportSettingRequested(null);
        setImportDataBuffer(null);

        setPinCodeSettingsRequested(false);
        setPinCodeEntered(null);
        setPinCodeEnteringFinished(false);
        setCurrentPinCodeConfirmed(false);
        setPinCodeRepeatEntered(null);
        setInvalidPinCode(false);
        setDeletePinCodeRequested(false);

        setEnabledCcxtIntegrations(getEnabledCcxtIntegrations())
        setLoadingUserDataFromResource(null)
        setCurrentSettingInputsInvalid(false)
        setCurrentIntegrationApiKey(null)
        setCurrentIntegrationApiSecret(null)
        setCurrentIntegrationApiPassword(null)
        setCurrentIntegrationApiAdditionalSetting(null)
    }

    const currencyService = useMemo(() => new CurrencyService(
        binanceCurrencies || {},
        monobankCurrencies || {},
        okxCurrencies || {},
        coinGeckoCurrencies || {},
    ), [binanceCurrencies,
        monobankCurrencies,
        okxCurrencies,
        coinGeckoCurrencies])

    const priceService = useMemo(() => new PriceService(
        binancePrices || {},
        monobankRates || [],
        okxPrices || {},
        coinGeckoPrices || {},
    ), [binancePrices,
        monobankRates,
        okxPrices,
        coinGeckoPrices])

    function getCurrencyOptions(): Option[] {
        return Array.from(currencyService.getCurrencyList())
            .sort(compareStringsIgnoreCase)
            .filter(o => o)
            .map(option => ({
                value: option,
                label: option,
            }))
    }

    const currencyOptions = useMemo(getCurrencyOptions, [binanceCurrencies,
        monobankCurrencies,
        okxCurrencies,
        coinGeckoCurrencies])

    const props: Props = {
        anyAssetExist,
        showCreateNewAssetWindow, setShowCreateNewAssetWindow,
        creatingNewAsset, setCreatingNewAsset,
        userData, setUserData,
        userDataHolder, setUserDataHolder,
        newAssetAmount, setNewAssetAmount,
        newAssetCurrency, setNewAssetCurrency,
        newAssetName, setNewAssetName,
        isNewAssetAmountInvalid, setIsNewAssetAmountInvalid,
        isNewAssetNameInvalid, setIsNewAssetNameInvalid,
        assetToDelete, setAssetToDelete,
        assetToEdit, setAssetToEdit,
        stateReset,
        showConfigsWindow, setShowConfigsWindow,
        integrationWindowNameSelected, setIntegrationWindowNameSelected,
        termsAndPolicyAgreed, setTermsAndPolicyAgreed,

        enabledCcxtIntegrations, setEnabledCcxtIntegrations,
        loadingUserDataFromResource, setLoadingUserDataFromResource,
        currentSettingInputsInvalid, setCurrentSettingInputsInvalid,
        currentIntegrationApiKey, setCurrentIntegrationApiKey,
        currentIntegrationApiSecret, setCurrentIntegrationApiSecret,
        currentIntegrationApiPassword, setCurrentIntegrationApiPassword,
        currentIntegrationApiAdditionalSetting, setCurrentIntegrationApiAdditionalSetting,
        ccxtUserData, setCcxtUserData,

        monobankCurrencies, monobankRates,
        monobankSettingsEnabled, setMonobankSettingsEnabled,
        monobankApiTokenInput, setMonobankApiTokenInput,
        monobankApiTokenInputInvalid, setMonobankApiTokenInputInvalid,
        monobankUserData, setMonobankUserData,
        monobankUserDataLoading, setMonobankUserDataLoading,

        binanceCurrencies, binanceCurrenciesLoaded,
        binancePrices, binancePricesLoaded,
        binanceSettingsEnabled, setBinanceSettingsEnabled,
        binanceApiKeyInput, setBinanceApiKeyInput,
        binanceApiSecretInput, setBinanceApiSecretInput,
        binanceApiKeysInputInvalid, setBinanceApiKeysInputInvalid,
        binanceUserData, setBinanceUserData,
        binanceUserDataLoading, setBinanceUserDataLoading,

        okxCurrencies, okxCurrenciesLoaded,
        okxPrices, okxPricesLoaded,
        okxSettingsEnabled, setOkxSettingsEnabled,
        okxApiKeyInput, setOkxApiKeyInput,
        okxApiSecretInput, setOkxApiSecretInput,
        okxApiPassPhraseInput, setOkxApiPassPhraseInput,
        okxApiSubAccountNameInput, setOkxApiSubAccountNameInput,
        okxApiKeysInputInvalid, setOkxApiKeysInputInvalid,
        okxUserData, setOkxUserData,
        okxUserDataLoading, setOkxUserDataLoading,

        coinGeckoCurrencies, coinGeckoCurrenciesLoaded,
        coinGeckoPrices, coinGeckoPricesLoaded,

        loadMonobankUserData, loadBinanceUserData, loadOkxUserData, loaded,

        selectedPageNumber, setSelectedPageNumber,
        firstPageChartView, setFirstPageChartView,
        importOrExportSettingRequested, setImportOrExportSettingRequested,
        importDataBuffer, setImportDataBuffer,

        pinCodeSettingsRequested, setPinCodeSettingsRequested,
        setPinCode,
        pinCodeEntered, setPinCodeEntered,
        pinCodeEnteringFinished, setPinCodeEnteringFinished,
        pinCodeRepeatEntered, setPinCodeRepeatEntered,
        invalidPinCode, setInvalidPinCode,
        currentPinCodeConfirmed, setCurrentPinCodeConfirmed,
        deletePinCodeRequested, setDeletePinCodeRequested,
        currencyService,
        priceService,
        currencyOptions,
    };
    return (
        <div className={"application layer-0-themed-color"}>
            {shouldEnterPinCode ? <PinCodeOnLogin props={{
                pinCodeEntered, setPinCodeEntered,
                setPinCode,
            }}/> : loggedIn
                ? AssetsDashboard(props)
                : NotLoggedIn(props)
            }
        </div>
    );
};
