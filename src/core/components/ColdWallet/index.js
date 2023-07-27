import React, {useState} from 'react';
import BinanceLoader from "../../../web/integrations/binance/BinanceLoader";
import MonobankLoader from "../../../web/integrations/monobank/MonobankLoader";
import LoadingWindow from "../LoadingWindow";
import NotLoggedIn from "../NotLoggedIn";
import AssetsDashboard from "../assets/AssetsDashboard";
import OnStartupLoader from "../OnStartupLoader";
import UserData from "../../../web/storage/UserData";

export default function ColdWallet() {
    const {binancePrices, binancePricesLoaded, binanceCurrencies, binanceCurrenciesLoaded} = BinanceLoader();
    const {monobankRates, monobankCurrencies} = MonobankLoader();
    const {loaded} = OnStartupLoader(
        binancePricesLoaded,
        binanceCurrenciesLoaded,
        monobankRates,
        monobankCurrencies,
    );
    const {userData, setUserData} = UserData();

    const [showCreateNewAssetWindow, setShowCreateNewAssetWindow] = useState(!(userData?.assets?.length));
    const [creatingNewAsset, setCreatingNewAsset] = useState(!(userData?.assets?.length));
    const [newAssetCurrency, setNewAssetCurrency] = useState(null);
    const [newAssetAmount, setNewAssetAmount] = useState(null);
    const [newAssetName, setNewAssetName] = useState(null);
    const [isNewAssetAmountInvalid, setIsNewAssetAmountInvalid] = useState(false);
    const [isNewAssetNameInvalid, setIsNewAssetNameInvalid] = useState(false);
    const [assetToDelete, setAssetToDelete] = useState(null);
    const [assetToEdit, setAssetToEdit] = useState(null);

    const loggedIn = !!userData && !userData.loginRequired;

    return (
        <div className={"App background-themed-color"}>
            {loaded
                ? loggedIn
                    ? AssetsDashboard(
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
                    )
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
