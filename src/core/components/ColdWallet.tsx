import React, {useState} from 'react';
import BinanceLoader from "./../integrations/binance/BinanceLoader";
import MonobankLoader from "./../integrations/monobank/MonobankLoader";
import LoadingWindow from "./LoadingWindow";
import NotLoggedIn from "./NotLoggedIn";
import AssetsDashboard from "./AssetsDashboard";
import OnStartupLoader from "./OnStartupLoader";
import StorageFactory from "../domain/StorageFactory";
import UserData from "../domain/UserData";

export default function ColdWallet(props: StorageFactory,) {
    const storageFactory: StorageFactory = props;
    const [userData, setUserData] = props.createStorage<UserData>(
        "userData", () => new UserData()
    );
    const {binancePrices, binancePricesLoaded, binanceCurrencies, binanceCurrenciesLoaded} = BinanceLoader(storageFactory);
    const {
        monobankRates,
        monobankCurrencies,
        monobankUserData,
        setMonobankUserData,
    } = MonobankLoader(storageFactory, userData.settings.monobankIntegrationToken);

    const {loaded} = OnStartupLoader(
        binancePricesLoaded,
        binanceCurrenciesLoaded,
        monobankRates,
        monobankCurrencies,
    );
    const [showCreateNewAssetWindow, setShowCreateNewAssetWindow] = useState(!(userData.assets.length));
    const [creatingNewAsset, setCreatingNewAsset] = useState(!(userData.assets.length));
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
    const [monobankApiTokenInput, setMonobankApiTokenInput] = useState(userData.settings.monobankIntegrationToken);
    const [monobankApiTokenInputInvalid, setMonobankApiTokenInputInvalid] = useState(false);

    function stateReset() {
        setShowCreateNewAssetWindow(false);
        setCreatingNewAsset(false);
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
    }

    const loggedIn = !!(userData.id)// || !userData.loginRequired;

    return (
        <div className={"application background-themed-color"}>
            {loaded
                ? loggedIn
                    ? AssetsDashboard({
                        showCreateNewAssetWindow,
                        setShowCreateNewAssetWindow,
                        creatingNewAsset,
                        setCreatingNewAsset,
                        userData,
                        newAssetAmount,
                        setNewAssetAmount,
                        newAssetCurrency,
                        setNewAssetCurrency,
                        newAssetName,
                        setNewAssetName,
                        isNewAssetAmountInvalid,
                        setIsNewAssetAmountInvalid,
                        isNewAssetNameInvalid,
                        setIsNewAssetNameInvalid,
                        setUserData,
                        monobankCurrencies,
                        binanceCurrencies,
                        assetToDelete,
                        setAssetToDelete,
                        assetToEdit,
                        setAssetToEdit,
                        stateReset,
                        showConfigsWindow,
                        setShowConfigsWindow,
                        monobankSettingsEnabled,
                        setMonobankSettingsEnabled,
                        monobankApiTokenInput,
                        setMonobankApiTokenInput,
                        monobankApiTokenInputInvalid,
                        setMonobankApiTokenInputInvalid,
                        monobankUserData,
                        setMonobankUserData,
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
