import ApiResponse from "../../domain/ApiResponse";
import Binance from 'binance-api-node'

const binanceApiClient = {
    fetchBinancePrices: async (): Promise<ApiResponse<{ [p: string]: string } | any>> => {
        try {
            const prices = await Binance().prices();
            return ApiResponse.success(200, prices,)
        } catch (error: any) {
            console.warn('Error fetching prices from binance:', error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    },
    fetchBinanceCurrencies: async () => {
        try {
            const response = await Binance().exchangeInfo();
            const binanceCurrenciesLoaded = response.symbols
                .reduce((result, symbol) => [
                    ...result,
                    symbol.baseAsset,
                    symbol.quoteAsset
                ], new Array<string>())
            return ApiResponse.success(200, binanceCurrenciesLoaded,)
        } catch (error: any) {
            console.warn('Error fetching currencies from binance:', error.message || error);
            return ApiResponse.fail(
                error?.response?.status,
                error.message || error.response?.data?.errorDescription,
            )
        }
    }
}

export default binanceApiClient;
