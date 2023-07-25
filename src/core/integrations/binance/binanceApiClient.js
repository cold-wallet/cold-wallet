import axios from "axios";

const binanceApiDomain = 'https://api.binance.com';
const apiV3Prefix = '/api/v3';
const urlBinancePrices = binanceApiDomain + apiV3Prefix + '/ticker/price';
const urlBinanceCurrencies = binanceApiDomain + apiV3Prefix + '/exchangeInfo';

const binanceApiClient = {
    fetchBinancePrices: async () => {
        try {
            const response = await axios.get(urlBinancePrices);
            if (response.data.length) {
                const prices = response.data.reduce((result, rate) => {
                    result[rate.symbol] = rate.price;
                    return result
                }, {});
                return {
                    success: true,
                    result: prices,
                }
            } else {
                console.warn("received empty response:", response);
                return {
                    success: false,
                    error: "empty response"
                }
            }
        } catch (error) {
            console.warn('Error fetching prices from binance:', error.message || error);
            return {
                success: false,
                error: error.message || error.response?.data?.errorDescription
            }
        }
    },
    fetchBinanceCurrencies: async () => {
        try {
            const response = await axios.get(urlBinanceCurrencies);
            let symbols = response.data.symbols;
            if (symbols) {
                let binanceCurrenciesLoaded = Object.keys(symbols
                    .reduce((result, symbol) => {
                        result[symbol.baseAsset] = true;
                        result[symbol.quoteAsset] = true;
                        return result
                    }, {}));
                return {
                    success: true,
                    result: binanceCurrenciesLoaded,
                }
            } else {
                return {
                    success: false,
                    error: "empty response",
                }
            }
        } catch (error) {
            console.warn('Error fetching currencies from binance:', error.message || error);
            return {
                success: false,
                error: error.message || error.response?.data?.errorDescription
            }
        }
    }
}

export default binanceApiClient;
