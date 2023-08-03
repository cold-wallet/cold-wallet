import React, {useState} from 'react';
import BinanceLoader from "./../../web/integrations/binance/BinanceLoader";
import MonobankLoader from "./../../web/integrations/monobank/MonobankLoader";
import LoadingWindow from "./LoadingWindow";
import NotLoggedIn from "./NotLoggedIn";
import AssetsDashboard from "./AssetsDashboard";
import OnStartupLoader from "./OnStartupLoader";
import UserDataStorage from "./../../web/storage/UserDataStorage";

export default function ColdWallet() {
    const {binancePrices, binancePricesLoaded, binanceCurrencies, binanceCurrenciesLoaded} = BinanceLoader();
    const {monobankRates, monobankCurrencies} = MonobankLoader();
    const {loaded} = OnStartupLoader(
        binancePricesLoaded,
        binanceCurrenciesLoaded,
        monobankRates,
        monobankCurrencies,
    );
    const {userData, setUserData} = UserDataStorage();

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
