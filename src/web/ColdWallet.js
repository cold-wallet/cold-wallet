import React, {useState} from 'react';
import BinanceLoader from "../core/integrations/binance/BinanceLoader";
import MonobankLoader from "../core/integrations/monobank/MonobankLoader";
import LoadingWindow from "../core/components/LoadingWindow";
import NotLoggedIn from "../core/components/NotLoggedIn";
import AssetsDashboard from "../core/components/assets/AssetsDashboard";
import OnStartupLoader from "../core/components/OnStartupLoader";
import UserData from "../core/components/UserData";

const ColdWallet = () => {
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

export default ColdWallet;
