import React, {useEffect, useState} from 'react';
import BinanceLoader from "./../integrations/binance/BinanceLoader";
import MonobankLoader from "./../integrations/monobank/MonobankLoader";
import LoadingWindow from "./LoadingWindow";
import NotLoggedIn from "./unauthorized/NotLoggedIn";
import AssetsDashboard from "./AssetsDashboard";
import OnStartupLoader from "./OnStartupLoader";
import StorageFactory from "../domain/StorageFactory";
import UserData from "../domain/UserData";
import {AccountInfo} from "../integrations/binance/binanceApiClient";
import MonobankUserData from "../integrations/monobank/MonobankUserData";
import LoginWatcher from "./LoginWatcher";
import PinCodeOnLogin from "./unauthorized/PinCodeOnLogin";
import OkxLoader from "../integrations/okx/OkxLoader";

export default function ColdWallet(
    {props}: {
        props: {
            storageFactory: StorageFactory
        },
    }
) {
    const [userData, setUserData] = props.storageFactory.createStorage<UserData>(
        "userData", () => new UserData()
    );
    const {
        shouldEnterPinCode,
        pinCodeEnteredSuccessfully, setPinCodeEnteredSuccessfully,
    } = LoginWatcher({userData, setUserData,})

    const {
        binancePrices, binancePricesLoaded,
        binanceCurrencies, binanceCurrenciesLoaded,
        binanceUserData, setBinanceUserData,
        loadBinanceUserData,
    } = BinanceLoader(
        !shouldEnterPinCode,
        props.storageFactory,
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
        !shouldEnterPinCode,
        props.storageFactory,
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
        !shouldEnterPinCode,
        props.storageFactory,
        userData.settings.monobankIntegrationEnabled,
        userData.settings.monobankIntegrationToken
    );

    const {loaded} = OnStartupLoader(
        binancePricesLoaded,
        binanceCurrenciesLoaded,
        monobankRates,
        monobankCurrencies,
    );
    const [newAssetCurrency, setNewAssetCurrency] = useState(null);
    const [newAssetAmount, setNewAssetAmount] = useState(null);
    const [newAssetName, setNewAssetName] = useState(null);
    const [isNewAssetAmountInvalid, setIsNewAssetAmountInvalid] = useState(false);
    const [isNewAssetNameInvalid, setIsNewAssetNameInvalid] = useState(false);
    const [assetToDelete, setAssetToDelete] = useState(null);
    const [assetToEdit, setAssetToEdit] = useState(null);
    const [showConfigsWindow, setShowConfigsWindow] = useState(false);
    const [monobankSettingsEnabled, setMonobankSettingsEnabled] = useState(
        userData.settings.monobankIntegrationEnabled
    );
    const [monobankApiTokenInput, setMonobankApiTokenInput] = useState(
        userData.settings.monobankIntegrationToken
    );
    const [monobankApiTokenInputInvalid, setMonobankApiTokenInputInvalid] = useState(false);
    const [monobankUserDataLoading, setMonobankUserDataLoading] = useState(false);
    const [integrationWindowNameSelected, setIntegrationWindowNameSelected] = useState(null);


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

    function getAnyAssetExist() {
        return !!(userData.assets.length)
            || userData.settings.binanceIntegrationEnabled && AccountInfo.assetsExist(binanceUserData)
            || userData.settings.monobankIntegrationEnabled && MonobankUserData.assetsExist(monobankUserData)
    }

    let anyAssetExist = getAnyAssetExist();

    useEffect(() => {
        anyAssetExist = getAnyAssetExist()
    }, [userData])

    const [showCreateNewAssetWindow, setShowCreateNewAssetWindow] = useState(!anyAssetExist);
    const [creatingNewAsset, setCreatingNewAsset] = useState(!anyAssetExist);

    const [selectedPageNumber, setSelectedPageNumber] = useState(0);
    const [firstPageChartView, setFirstPageChartView] = useState('pie');

    const [importOrExportSettingRequested, setImportOrExportSettingRequested] = useState(null);
    const [importDataBuffer, setImportDataBuffer] = useState(null);

    const [pinCodeSettingsRequested, setPinCodeSettingsRequested] = useState(false);
    const [pinCodeEntered, setPinCodeEntered] = useState<string | null>(null);
    const [pinCodeEnteringFinished, setPinCodeEnteringFinished] = useState(false);
    const [currentPinCodeConfirmed, setCurrentPinCodeConfirmed] = useState(false);
    const [pinCodeRepeatEntered, setPinCodeRepeatEntered] = useState<string | null>(null);
    const [invalidPinCode, setInvalidPinCode] = useState(false);

    const [deletePinCodeRequested, setDeletePinCodeRequested] = useState(false);

    function stateReset() {
        setShowCreateNewAssetWindow(!getAnyAssetExist());
        setCreatingNewAsset(!getAnyAssetExist());
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
    }

    const loggedIn = !!(userData.id)// || !userData.loginRequired;

    return (
        <div className={"application layer-0-themed-color"}>
            {shouldEnterPinCode ? <PinCodeOnLogin props={{
                userData, setPinCodeEnteredSuccessfully,
                pinCodeEntered, setPinCodeEntered,
            }}/> : loaded
                ? loggedIn
                    ? AssetsDashboard({
                        anyAssetExist,
                        showCreateNewAssetWindow, setShowCreateNewAssetWindow,
                        creatingNewAsset, setCreatingNewAsset,
                        userData, setUserData,
                        newAssetAmount, setNewAssetAmount,
                        newAssetCurrency, setNewAssetCurrency,
                        newAssetName, setNewAssetName,
                        isNewAssetAmountInvalid, setIsNewAssetAmountInvalid,
                        isNewAssetNameInvalid, setIsNewAssetNameInvalid,
                        monobankCurrencies, monobankRates,
                        binanceCurrencies, binancePrices,
                        assetToDelete, setAssetToDelete,
                        assetToEdit, setAssetToEdit,
                        stateReset,
                        showConfigsWindow, setShowConfigsWindow,

                        monobankSettingsEnabled, setMonobankSettingsEnabled,
                        monobankApiTokenInput, setMonobankApiTokenInput,
                        monobankApiTokenInputInvalid, setMonobankApiTokenInputInvalid,
                        monobankUserData, setMonobankUserData,
                        monobankUserDataLoading, setMonobankUserDataLoading,

                        integrationWindowNameSelected, setIntegrationWindowNameSelected,

                        binanceSettingsEnabled, setBinanceSettingsEnabled,
                        binanceApiKeyInput, setBinanceApiKeyInput,
                        binanceApiSecretInput, setBinanceApiSecretInput,
                        binanceApiKeysInputInvalid, setBinanceApiKeysInputInvalid,
                        binanceUserData, setBinanceUserData,
                        binanceUserDataLoading, setBinanceUserDataLoading,

                        okxCurrencies,
                        okxSettingsEnabled, setOkxSettingsEnabled,
                        okxApiKeyInput, setOkxApiKeyInput,
                        okxApiSecretInput, setOkxApiSecretInput,
                        okxApiPassPhraseInput, setOkxApiPassPhraseInput,
                        okxApiSubAccountNameInput, setOkxApiSubAccountNameInput,
                        okxApiKeysInputInvalid, setOkxApiKeysInputInvalid,
                        okxUserData, setOkxUserData,
                        okxUserDataLoading, setOkxUserDataLoading,

                        selectedPageNumber, setSelectedPageNumber,
                        firstPageChartView, setFirstPageChartView,
                        importOrExportSettingRequested, setImportOrExportSettingRequested,
                        importDataBuffer, setImportDataBuffer,
                        loadMonobankUserData, loadBinanceUserData, loadOkxUserData,

                        pinCodeSettingsRequested, setPinCodeSettingsRequested,
                        pinCodeEntered, setPinCodeEntered,
                        pinCodeEnteringFinished, setPinCodeEnteringFinished,
                        pinCodeRepeatEntered, setPinCodeRepeatEntered,
                        invalidPinCode, setInvalidPinCode,
                        currentPinCodeConfirmed, setCurrentPinCodeConfirmed,
                        deletePinCodeRequested, setDeletePinCodeRequested,
                    })
                    : NotLoggedIn(
                        userData, setUserData, importDataBuffer, setImportDataBuffer,
                        importOrExportSettingRequested, setImportOrExportSettingRequested,
                        loadMonobankUserData, loadBinanceUserData, loadOkxUserData,
                        stateReset, setShowCreateNewAssetWindow, setCreatingNewAsset,
                    )
                : LoadingWindow(
                    binancePricesLoaded, binancePrices,
                    binanceCurrenciesLoaded, binanceCurrencies,
                    okxPricesLoaded, okxPrices,
                    okxCurrenciesLoaded, okxCurrencies,
                    monobankRates,
                    monobankCurrencies)
            }
        </div>
    );
};
