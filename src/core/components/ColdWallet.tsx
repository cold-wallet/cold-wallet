import React, {useEffect, useMemo, useRef, useState} from 'react';
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
import useIdleLock, {AUTO_LOCK_AFTER} from "../utils/useIdleLock";
import UserData from "../domain/UserData";
import CoinGeckoLoader from "../integrations/coingecko/CoinGeckoLoader";
import AssetDTO from "../domain/AssetDTO";
import OnStartupLoader from "./OnStartupLoader";
import { collectHoldings, enabledCcxtHoldings } from "./holdings";
import { isPriced } from "../ui/portfolio";
import Props from "./Props";
import CcxtLoader, {CcxtAccountsData} from "../integrations/ccxt/CcxtLoader";
import {CurrencyService} from "../services/CurrencyService";
import {compareStringsIgnoreCase} from "../utils/compareStrings";
import Option from "./integrations/SelectIntegration/Option";
import PriceService from "../services/PriceService";
import MetaMaskLoader from "../integrations/metamask/MetaMaskLoader";
import UserDataStorageFactory from "../domain/UserDataStorageFactory";
import {buildDemoUserDataHolder} from "../utils/DemoAssetsGenerator";
import uuidGenerator from "../utils/uuidGenerator";
import PinSetup from "./pin/PinSetup";
import type {ImportedWallet} from "../services/UserDataService";

export default function ColdWallet(
    {properties, startInDemoMode = false}: {
        properties: {
            storageFactory: StorageFactory,
            userDataStorageFactory: UserDataStorageFactory,
            // Store for integration *UserData (binance/okx/monobank). In-memory during a demo
            // session so injected demo assets never persist; the plain localStorage factory
            // otherwise.
            integrationUserDataStorageFactory: StorageFactory,
        },
        startInDemoMode?: boolean,
    }
) {
    const [termsAndPolicyAgreed, setTermsAndPolicyAgreed] = useState<boolean>(false);

    const {
        userData, setUserData, setUserDataPin,
        userDataHolder,
        shouldEnterPinCode,
        isDemoMode,
        loggedIn,
        lockReason,
        unlock, verifyPin, lock,
        createWallet: createStoredWallet, importWallet, startDemo,
    } = UserDataService({
        storageFactory: properties.userDataStorageFactory,
    });

    function lockWallet(reason: 'idle' | 'manual') {
        lock(reason);
    }
    // An unlocked wallet locks itself after a while without any user activity.
    useIdleLock(loggedIn && !isDemoMode && userDataHolder.pinCodeEncrypted, () => lockWallet('idle'), AUTO_LOCK_AFTER);

    // `/demo` route: drop straight into demo mode, bypassing the startup login screen.
    // Runs once on mount. Skips only if an active demo session is already logged in — the
    // default holder carries demo=true but isn't logged in (no user id), so we still need to
    // build a real demo UserData to land on the dashboard.
    const demoModeStarted = useRef(false);
    useEffect(() => {
        if (startInDemoMode && !demoModeStarted.current && !(loggedIn && isDemoMode)) {
            demoModeStarted.current = true;
            startDemo(buildDemoUserDataHolder());
        }
    }, [startInDemoMode, loggedIn, isDemoMode, startDemo]);

    // Crypto symbols whose prices the UI actually needs (held assets across all sources);
    // collected by an effect below, AFTER every integration loader has produced its data.
    const [neededPriceSymbols, setNeededPriceSymbols] = useState<string[]>([]);
    const {
        coinGeckoPrices, coinGeckoPricesLoaded,
        coinGeckoCurrencies, coinGeckoCurrenciesLoaded,
        prefetchCoinGeckoPrice,
        coinGeckoPricePending,
    } = CoinGeckoLoader(properties.storageFactory, neededPriceSymbols)

    const loadingUserDataAllowed = !isDemoMode && !shouldEnterPinCode;
    const {
        binancePrices, binancePricesLoaded,
        binanceCurrencies, binanceCurrenciesLoaded,
        binanceUserData, setBinanceUserData,
        loadBinanceUserData,
    } = BinanceLoader(
        isDemoMode,
        loadingUserDataAllowed,
        properties.storageFactory,
        properties.integrationUserDataStorageFactory,
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
        isDemoMode,
        loadingUserDataAllowed,
        properties.storageFactory,
        properties.integrationUserDataStorageFactory,
        userData.settings.okxIntegrationEnabled,
        userData.settings.okxIntegrationApiKey,
        userData.settings.okxIntegrationApiSecret,
        userData.settings.okxIntegrationPassPhrase,
        userData.settings.okxIntegrationSubAccountName,
    );
    const {
        monobankRates,
        monobankCurrencies,
        monobankRatesFresh,
        monobankUserData,
        setMonobankUserData,
        loadMonobankUserData,
    } = MonobankLoader(
        isDemoMode,
        loadingUserDataAllowed,
        properties.storageFactory,
        properties.integrationUserDataStorageFactory,
        userData.settings.monobankIntegrationEnabled,
        userData.settings.monobankIntegrationToken
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

    const {
        clearMetaMaskData,
        metaMaskSettingsEnabled, setMetaMaskSettingsEnabled,
        metaMaskAssets,
        refreshMetaMaskAsset,
        metaMaskWallet,
        metaMaskIsError,
        metaMaskErrorMessage,
        metaMaskHasProvider,
        metaMaskIsConnecting,
        metaMaskHandleConnect,
    } = MetaMaskLoader(isDemoMode, loadingUserDataAllowed, binanceCurrencies, coinGeckoCurrencies, properties.storageFactory, userData)

    // Collect the symbols of every held asset (manual + all integrations) for the CoinGecko
    // needed-first price fetch. Updates only when the set actually changes.
    useEffect(() => {
        const symbols = new Set<string>();
        userData.assets.forEach(a => symbols.add(a.currency.toUpperCase()));
        if (binanceUserData) {
            AccountInfo.getAllAssets(binanceUserData).forEach(a => symbols.add(a.currency.toUpperCase()));
        }
        if (okxUserData) {
            OkxAccount.getAllAssets(okxUserData).forEach(a => symbols.add(a.currency.toUpperCase()));
        }
        if (monobankUserData) {
            MonobankUserData.getAllAssets(monobankUserData).forEach(a => symbols.add(a.currency.toUpperCase()));
        }
        (metaMaskAssets || []).forEach(a => symbols.add(a.currency.toUpperCase()));
        Object.values(ccxtUserData).forEach(assets => assets.forEach(a => symbols.add(a.currency.toUpperCase())));
        const next = Array.from(symbols).sort();
        if (next.join(',') !== neededPriceSymbols.join(',')) {
            setNeededPriceSymbols(next);
        }
    }, [userData, binanceUserData, okxUserData, monobankUserData, metaMaskAssets, ccxtUserData, neededPriceSymbols]);

    function getAnyAssetExist(
        userData: UserData,
        binanceUserData: AccountInfo | null,
        okxUserData: OkxAccount | null,
        monobankUserData: MonobankUserData | null,
        ccxtUserData: CcxtAccountsData,
    ) {
        return !!(userData.assets.length)
            || (userData.settings.binanceIntegrationEnabled && AccountInfo.assetsExist(binanceUserData))
            || (userData.settings.okxIntegrationEnabled && OkxAccount.assetsExist(okxUserData))
            || (userData.settings.monobankIntegrationEnabled && MonobankUserData.assetsExist(monobankUserData))
            || enabledCcxtHoldings(userData, ccxtUserData).length > 0
    }

    const anyAssetExist = useMemo(
        () => getAnyAssetExist(userData, binanceUserData, okxUserData, monobankUserData, ccxtUserData),
        [userData, binanceUserData, okxUserData, monobankUserData, ccxtUserData]
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

    // Representation-only privacy toggle: when on, all amounts/USD equivalents render as a
    // fixed mask. Persisted via the same storage abstraction as everything else (swappable
    // for native on mobile). Default off (amounts shown). Never touches userData/calculations.
    const [hideAmounts, setHideAmounts] = properties.storageFactory.createStorage<boolean>("hideAmounts", () => false);
    const toggleHideAmounts = () => setHideAmounts((v) => !v);

    const [importOrExportSettingRequested, setImportOrExportSettingRequested] = useState<string | null>(null);
    const [importDataBuffer, setImportDataBuffer] = useState<string | null>(null);

    const [pinCodeSettingsRequested, setPinCodeSettingsRequested] = useState(false);
    const [pinChanged, setPinChanged] = useState(false);

    // Cached integration balances belong to the wallet they were fetched for; they are dropped when
    // another wallet takes its place, so none of them show up in the new one.
    function dropIntegrationBalances() {
        setBinanceUserData(null);
        setOkxUserData(null);
        setMonobankUserData(null);
        setCcxtUserData({} as CcxtAccountsData);
        clearMetaMaskData();
    }

    // A new wallet is always created locked with a PIN and opens unlocked.
    async function createWallet(pin: string) {
        const newUserData = new UserData(uuidGenerator.generateUUID());
        await createStoredWallet(newUserData, pin);
        dropIntegrationBalances();
    }

    // Exchange balances are fetched with the settings of the wallet that is open. After an unlock or
    // an import those settings change, so the next render (which has them) fetches once more.
    const [integrationsReload, setIntegrationsReload] = useState(0);
    useEffect(() => {
        if (!integrationsReload) return;
        loadBinanceUserData();
        loadOkxUserData();
        loadMonobankUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [integrationsReload]);

    // An imported backup replaces the wallet: the previous one's cached balances go, and the
    // restored one's are fetched with its own settings.
    async function importReplacing(imported: ImportedWallet, pin?: string) {
        await importWallet(imported, pin);
        dropIntegrationBalances();
        setIntegrationsReload((n) => n + 1);
    }

    // "Forgot PIN?" → the start screen over the locked wallet: creating or importing a wallet there
    // replaces it; until then it stays, and "Back to unlock" (or a reload) returns to its PIN.
    const [startingOver, setStartingOver] = useState(false);

    // Every real wallet must have a PIN: an older wallet created without one, or one restored from
    // a backup that had none, has to set it before the dashboard opens. The demo never needs one.
    const pinSetupRequired = loggedIn && !isDemoMode && !userDataHolder.pinCodeEncrypted;
    // Set or change the wallet's PIN: the data is locked with the new one and stays unlocked.
    const setWalletPin = setUserDataPin;

    function stateReset() {
        setShowCreateNewAssetWindow(!getAnyAssetExist(
            userData, binanceUserData, okxUserData, monobankUserData, ccxtUserData,
        ));
        setCreatingNewAsset(!getAnyAssetExist(
            userData, binanceUserData, okxUserData, monobankUserData, ccxtUserData,
        ));
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
        setPinChanged(false);

        setEnabledCcxtIntegrations(getEnabledCcxtIntegrations())
        setLoadingUserDataFromResource(null)
        setCurrentSettingInputsInvalid(false)
        setCurrentIntegrationApiKey(null)
        setCurrentIntegrationApiSecret(null)
        setCurrentIntegrationApiPassword(null)
        setCurrentIntegrationApiAdditionalSetting(null)
    }

    // Every lock (idle, the Lock button, a PIN changed in another tab) closes whatever was open:
    // settings, a backup token on screen, half-typed keys or amounts. Nothing typed survives it.
    // Unlocking resets once more, from the data just opened, so the dashboard starts clean.
    const wasLocked = useRef(shouldEnterPinCode);
    useEffect(() => {
        if (wasLocked.current === shouldEnterPinCode) return;
        wasLocked.current = shouldEnterPinCode;
        stateReset();
        setStartingOver(false);
        if (!shouldEnterPinCode) setIntegrationsReload((n) => n + 1);
    });

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

    // every holding the dashboard shows, and whether some of them have no price yet
    const allAssets = useMemo(() => collectHoldings({
        userData, binanceUserData, okxUserData, monobankUserData,
        metaMaskSettingsEnabled, metaMaskAssets, ccxtUserData,
    }), [userData, binanceUserData, okxUserData, monobankUserData, metaMaskSettingsEnabled, metaMaskAssets, ccxtUserData]);
    const pricesMissing = useMemo(
        () => allAssets.some((a) => !isPriced(a.currency, priceService)),
        [allAssets, priceService]);
    const pinSetupFirst = loggedIn && !isDemoMode && !userDataHolder.pinCodeEncrypted;
    const {loaded, syncing, stale} = OnStartupLoader({
        binancePricesLoaded,
        binanceCurrenciesLoaded,
        okxPricesLoaded,
        okxCurrenciesLoaded,
        monobankRatesFresh,
        pricesMissing,
        dashboardOpen: loggedIn && !shouldEnterPinCode && !pinSetupFirst,
    });
    /** a price for `currency` may still arrive: some source hasn't answered, or CoinGecko owes it */
    const pricePending = (currency: string) => syncing || coinGeckoPricePending(currency);

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
        userDataHolder, importWallet: importReplacing,
        isDemoMode,
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
        getAnyAssetExist,

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
        prefetchPrice: prefetchCoinGeckoPrice,

        metaMaskSettingsEnabled, setMetaMaskSettingsEnabled,
        metaMaskHasProvider,
        metaMaskIsConnecting,
        metaMaskAssets,
        refreshMetaMaskAsset,
        metaMaskWallet,
        metaMaskIsError,
        metaMaskErrorMessage,
        metaMaskHandleConnect,

        loadMonobankUserData, loadBinanceUserData, loadOkxUserData, loaded, syncing,
        pricesStale: stale, pricePending, allAssets,

        selectedPageNumber, setSelectedPageNumber,
        firstPageChartView, setFirstPageChartView,
        hideAmounts, toggleHideAmounts,
        importOrExportSettingRequested, setImportOrExportSettingRequested,
        importDataBuffer, setImportDataBuffer,

        pinCodeSettingsRequested, setPinCodeSettingsRequested,
        pinChanged, setPinChanged,
        verifyPin, setWalletPin,
        createWallet,
        lockWallet: () => lockWallet('manual'),
        currencyService,
        priceService,
        currencyOptions,
    };
    return (
        <div className={"app-root"}>
            {shouldEnterPinCode ? (startingOver
                ? <NotLoggedIn props={props}
                               replacing={{ onBack: () => { stateReset(); setStartingOver(false); } }}/>
                : <PinCodeOnLogin props={{
                    unlock,
                    lockReason,
                    startOver: () => { stateReset(); setStartingOver(true); },
                }}/>
            ) : pinSetupRequired
                ? <PinSetup title="Set a PIN-code"
                            intro="This wallet has no PIN yet. Set one to lock it on this device."
                            onDone={setWalletPin}/>
                : loggedIn
                    ? <AssetsDashboard props={props}/>
                    : <NotLoggedIn props={props}/>
            }
        </div>
    );
};
