import React, {useState} from 'react';
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

export default function ColdWallet(props: StorageFactory,) {
    const storageFactory: StorageFactory = props;
    const [userData, setUserData] = props.createStorage<UserData>(
        "userData", () => new UserData()
    );
    const {
        binancePrices, binancePricesLoaded,
        binanceCurrencies, binanceCurrenciesLoaded,
        binanceUserData, setBinanceUserData,
    } = BinanceLoader(
        storageFactory,
        userData.settings.binanceIntegrationEnabled,
        userData.settings.binanceIntegrationApiKey,
        userData.settings.binanceIntegrationApiSecret,
    );
    const {
        monobankRates,
        monobankCurrencies,
        monobankUserData,
        setMonobankUserData,
    } = MonobankLoader(
        storageFactory,
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

    function getAnyAssetExist() {
        return !!(userData.assets.length)
            || userData.settings.binanceIntegrationEnabled && AccountInfo.assetsExist(binanceUserData)
            || userData.settings.monobankIntegrationEnabled && MonobankUserData.assetsExist(monobankUserData)
    }

    let anyAssetExist = getAnyAssetExist();
    const [showCreateNewAssetWindow, setShowCreateNewAssetWindow] = useState(!anyAssetExist);
    const [creatingNewAsset, setCreatingNewAsset] = useState(!anyAssetExist);

    const [selectedPageNumber, setSelectedPageNumber] = useState(0);

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
        setMonobankSettingsEnabled(userData.settings.monobankIntegrationEnabled);
        setMonobankApiTokenInput(userData.settings.monobankIntegrationToken);
        setMonobankApiTokenInputInvalid(false);
        setMonobankUserDataLoading(false);
        setIntegrationWindowNameSelected(null);
        setBinanceSettingsEnabled(userData.settings.binanceIntegrationEnabled);
        setBinanceApiKeyInput(userData.settings.binanceIntegrationApiKey);
        setBinanceApiSecretInput(userData.settings.binanceIntegrationApiSecret);
        setBinanceApiKeysInputInvalid(false);
        setBinanceUserDataLoading(false);
    }

    const loggedIn = !!(userData.id)// || !userData.loginRequired;

    return (
        <div className={"application layer-0-themed-color"}>
            {loaded
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
                        monobankCurrencies,
                        binanceCurrencies,
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
                        selectedPageNumber, setSelectedPageNumber,
                    })
                    : NotLoggedIn(userData, setUserData)
                : LoadingWindow(binancePricesLoaded,
                    binancePrices,
                    binanceCurrenciesLoaded,
                    binanceCurrencies,
                    monobankRates,
                    monobankCurrencies)
            }
        </div>
    );
};
