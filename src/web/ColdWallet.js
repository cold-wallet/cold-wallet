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
    const [newAssetValue, setNewAssetValue] = useState(0);
    const [newAssetName, setNewAssetName] = useState("");
    const [isNewAssetInvalid, setIsNewAssetInvalid] = useState(false);
    const [isNewAssetNameInvalid, setIsNewAssetNameInvalid] = useState(false);
    const [assetToDelete, setAssetToDelete] = useState(null);

    const loggedIn = !!userData && !userData.loginRequired;

    return (
        <div className={"App background-themed-color"}>
            {loaded
                ? loggedIn
                    ? AssetsDashboard(
                        showCreateNewAssetWindow,
                        creatingNewAsset,
                        setShowCreateNewAssetWindow,
                        setCreatingNewAsset,
                        userData,
                        setNewAssetValue,
                        setNewAssetCurrency,
                        setNewAssetName,
                        newAssetValue,
                        setIsNewAssetInvalid,
                        newAssetName,
                        setIsNewAssetNameInvalid,
                        newAssetCurrency,
                        setUserData,
                        isNewAssetInvalid,
                        isNewAssetNameInvalid,
                        monobankCurrencies,
                        binanceCurrencies,
                        assetToDelete,
                        setAssetToDelete,
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
