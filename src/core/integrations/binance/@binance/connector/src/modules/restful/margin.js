'use strict'

const {validateRequiredParameters, hasOneOfParameters} = require('../../helpers/validation')

/**
 * API margin endpoints
 * @module Margin
 * @param {*} superclass
 */
const Margin = superclass => class extends superclass {
    /**
     * Get All Margin Assets (MARKET_DATA)<br>
     *
     * GET /sapi/v1/margin/allAssets<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/market-data/Get-All-Margin-Assets}
     */
    marginAllAssets() {
        return this.publicRequest(
            'GET',
            '/sapi/v1/margin/allAssets'
        )
    }

    /**
     * Get All Cross Margin Pairs (MARKET_DATA)<br>
     *
     * GET /sapi/v1/margin/allPairs<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/market-data/Get-All-Cross-Margin-Pairs}
     */
    marginAllPairs() {
        return this.publicRequest(
            'GET',
            '/sapi/v1/margin/allPairs'
        )
    }

    /**
     * Query Margin PriceIndex (MARKET_DATA)<br>
     *
     * GET /sapi/v1/margin/priceIndex<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/market-data/Query-Margin-PriceIndex}
     *
     * @param {string} symbol
     */
    marginPairIndex(symbol) {
        validateRequiredParameters({symbol})

        return this.publicRequest(
            'GET',
            '/sapi/v1/margin/priceIndex',
            {symbol: symbol.toUpperCase()}
        )
    }

    /**
     * Margin Account New Order (TRADE)<br>
     *
     * POST /sapi/v1/margin/order<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Margin-Account-New-Order}
     *
     * @param {string} symbol
     * @param {string} side - BUY or SELL
     * @param {string} type
     * @param {object} [options]
     * @param {string} [options.isIsolated] - TRUE or FALSE
     * @param {number} [options.quantity]
     * @param {number} [options.quoteOrderQty]
     * @param {number} [options.price]
     * @param {number} [options.stopPrice] - Used with STOP_LOSS, STOP_LOSS_LIMIT,
     *    TAKE_PROFIT, and TAKE_PROFIT_LIMIT orders.
     * @param {string} [options.newClientOrderId] - A unique id among open orders.
     *    Automatically generated if not sent.
     * @param {number} [options.icebergQty] - Used with LIMIT, STOP_LOSS_LIMIT,
     *    and TAKE_PROFIT_LIMIT to create an iceberg order.
     * @param {string} [options.newOrderRespType] - Set the response JSON. ACK, RESULT, or FULL;
     *    MARKET and LIMIT order types default to FULL, all other orders default to ACK.
     * @param {string} [options.sideEffectType] - NO_SIDE_EFFECT, MARGIN_BUY, AUTO_REPAY;
     *    default NO_SIDE_EFFECT.
     * @param {string} [options.timeInForce] - GTC, IOC, FOK
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    newMarginOrder(symbol, side, type, options = {}) {
        validateRequiredParameters({symbol, side, type})

        return this.signRequest(
            'POST',
            '/sapi/v1/margin/order',
            Object.assign(options, {
                symbol: symbol.toUpperCase(),
                side: side.toUpperCase(),
                type: type.toUpperCase()
            })
        )
    }

    /**
     * Margin Account Cancel Order (TRADE)<br>
     *
     * DELETE /sapi/v1/margin/order<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Margin-Account-Cancel-Order}
     *
     * @param {string} symbol
     * @param {object} [options]
     * @param {string} [options.isIsolated] - TRUE or FALSE
     * @param {number} [options.orderId]
     * @param {string} [options.origClientOrderId]
     * @param {string} [options.newClientOrderId] - Used to uniquely identify this cancel.
     *    Automatically generated by default.
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    cancelMarginOrder(symbol, options = {}) {
        validateRequiredParameters({symbol})

        return this.signRequest(
            'DELETE',
            '/sapi/v1/margin/order',
            Object.assign(options, {
                symbol: symbol.toUpperCase()
            })
        )
    }

    /**
     * Margin Account Cancel all Open Orders on a Symbol (TRADE)<br>
     *
     * DELETE /sapi/v1/margin/openOrders<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Margin-Account-Cancel-All-Open-Orders}
     *
     * @param {string} symbol
     * @param {object} [options]
     * @param {string} [options.isIsolated] - TRUE or FALSE, default "FALSE"
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    cancelAllOpenMarginOrder(symbol, options = {}) {
        validateRequiredParameters({symbol})

        return this.signRequest(
            'DELETE',
            '/sapi/v1/margin/openOrders',
            Object.assign(options, {
                symbol: symbol.toUpperCase()
            })
        )
    }

    /**
     * Get Cross Margin Transfer History (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/transfer<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/transfer/Get-Cross-Margin-Transfer-History}
     *
     * @param {object} [options]
     * @param {string} [options.asset]
     * @param {string} [options.type] - ROLL_IN, ROLL_OUT
     * @param {number} [options.startTime]
     * @param {number} [options.endTime]
     * @param {number} [options.current] - Currently querying page. Start from 1. Default:1
     * @param {number} [options.size] - Default:10 Max:100
     * @param {boolean} [options.archived] - Default: false. Set to true for archived data from 6 months ago
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginTransferHistory(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/transfer',
            options
        )
    }

    /**
     * Get Interest History (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/interestHistory<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/borrow-and-repay/Get-Interest-History}
     *
     * @param {object} [options]
     * @param {string} [options.asset]
     * @param {string} [options.isolatedSymbol]
     * @param {number} [options.startTime]
     * @param {number} [options.endTime]
     * @param {number} [options.current] - Currently querying page. Start from 1. Default:1
     * @param {number} [options.size] - Default:10 Max:100
     * @param {boolean} [options.archived] - Default: false. Set to true for archived data from 6 months ago
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginInterestHistory(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/interestHistory',
            options
        )
    }

    /**
     * Get Force Liquidation Record (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/forceLiquidationRec<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Get-Force-Liquidation-Record}
     *
     * @param {object} [options]
     * @param {number} [options.startTime]
     * @param {number} [options.endTime]
     * @param {string} [options.isolatedSymbol]
     * @param {number} [options.current] - Currently querying page. Start from 1. Default:1
     * @param {number} [options.size] - Default:10 Max:100
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginForceLiquidationRecord(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/forceLiquidationRec',
            options
        )
    }

    /**
     * Query Cross Margin Account Details (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/account<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/account/Query-Cross-Margin-Account-Details}
     *
     * @param {object} [options]
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginAccount(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/account',
            options
        )
    }

    /**
     * Query Margin Account's Order (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/order<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Query-Margin-Account-Order}
     *
     * @param {string} symbol
     * @param {object} [options]
     * @param {string} [options.isIsolated] - TRUE or FALSE, default "FALSE"
     * @param {number} [options.orderId]
     * @param {string} [options.origClientOrderId]
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginOrder(symbol, options = {}) {
        validateRequiredParameters({symbol})

        return this.signRequest(
            'GET',
            '/sapi/v1/margin/order',
            Object.assign(options, {
                symbol: symbol.toUpperCase()
            })
        )
    }

    /**
     * Query Margin Account's Open Order (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/openOrders<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Query-Margin-Account-Open-Orders}
     *
     * @param {object} [options]
     * @param {string} [options.symbol]
     * @param {string} [options.isIsolated] - TRUE or FALSE, default "FALSE"
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginOpenOrders(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/openOrders',
            options
        )
    }

    /**
     * Query Margin Account's All Order (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/allOrders<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Query-Margin-Account-All-Orders}
     *
     * @param {string} symbol
     * @param {object} [options]
     * @param {string} [options.isIsolated] - TRUE or FALSE, default "FALSE"
     * @param {number} [options.orderId]
     * @param {number} [options.startTime]
     * @param {number} [options.endTime]
     * @param {number} [options.limit] - Default 500; max 500.
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginAllOrders(symbol, options = {}) {
        validateRequiredParameters({symbol})

        return this.signRequest(
            'GET',
            '/sapi/v1/margin/allOrders',
            Object.assign(options, {
                symbol: symbol.toUpperCase()
            })
        )
    }

    /**
     * Marign Account New OCO (TRADE)<br>
     *
     * POST /sapi/v1/margin/order/oco<br>
     *
     * - Price Restrictions:<br>
     * SELL: Limit Price > Last Price > Stop Price<br>
     * BUY: Limit Price < Last Price < Stop Price<br>
     * - Quantity Restrictions:<br>
     * Both legs must have the same quantity<br>
     * ICEBERG quantities however do not have to be the same.<br>
     * - Order Rate Limit:<br>
     * OCO counts as 2 orders against the order rate limit.<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Margin-Account-New-OCO}
     *
     * @param {string} symbol
     * @param {string} side
     * @param {number} quantity
     * @param {number} price
     * @param {number} stopPrice
     * @param {object} [options]
     * @param {string} [options.isIsolated] - For isolated margin or not, "TRUE", "FALSE", default "FALSE"
     * @param {string} [options.listClientOrderId]
     * @param {string} [options.limitClientOrderId] - A unique Id for the limit order
     * @param {number} [options.limitIcebergQty]
     * @param {string} [options.stopClientOrderId] - A unique Id for the stop loss/stop loss limit leg.
     * @param {number} [options.stopLimitPrice] - If provided, stopLimitTimeInForce is required.
     * @param {number} [options.stopIcebergQty]
     * @param {string} [options.stopLimitTimeInForce] - GTC/ FOK/ IOC
     * @param {string} [options.newOrderRespType]
     * @param {string} [options.sideEffectType] - NO_SIDE_EFFECT, MARGIN_BUY, AUTO_REPAY; default NO_SIDE_EFFECT.
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginOCOOrder(symbol, side, quantity, price, stopPrice, options = {}) {
        validateRequiredParameters({symbol, side, quantity, price, stopPrice})

        return this.signRequest(
            'POST',
            '/sapi/v1/margin/order/oco',
            Object.assign(options, {
                symbol: symbol.toUpperCase(),
                side: side.toUpperCase(),
                quantity,
                price,
                stopPrice
            })
        )
    }

    /**
     * Margin Account Cancel OCO (TRADE)<br>
     *
     * DELETE /sapi/v1/margin/orderList<br>
     *
     * - Either orderListId or listClientOrderId must be provided<br>
     * - Canceling an individual leg will cancel the entire OCO<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Margin-Account-Cancel-OCO}
     *
     * @param {string} symbol
     * @param {object} [options]
     * @param {string} [options.isIsolated] - For isolated margin or not, "TRUE", "FALSE", default "FALSE"
     * @param {number} [options.orderListId]
     * @param {string} [options.listClientOrderId]
     * @param {string} [options.newClientOrderId] - Used to uniquely identify this cancel. Automatically generated by default.
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    cancelMarginOCOOrder(symbol, options = {}) {
        validateRequiredParameters({symbol})
        hasOneOfParameters({orderListId: options.orderListId, listClientOrderId: options.listClientOrderId})

        return this.signRequest(
            'DELETE',
            '/sapi/v1/margin/orderList',
            Object.assign(options, {
                symbol: symbol.toUpperCase()
            })
        )
    }

    /**
     * Query Margin Account's OCO (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/orderList<br>
     *
     * Either orderListId or origClientOrderId must be provided<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Query-Margin-Account-OCO}
     *
     * @param {object} [options]
     * @param {string} [options.isIsolated] - For isolated margin or not, "TRUE", "FALSE", default "FALSE"
     * @param {string} [options.symbol] - Mandatory for isolated margin, not supported for cross margin
     * @param {number} [options.orderListId]
     * @param {string} [options.origClientOrderId]
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    getMarginOCOOrder(options = {}) {
        hasOneOfParameters({orderListId: options.orderListId, origClientOrderId: options.origClientOrderId})
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/orderList',
            options
        )
    }

    /**
     * Query Marign Account's all OCO (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/allOrderList<br>
     *
     * Retrieves all OCO for a specific margin account based on provided optional parameters.<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Query-Margin-Account-All-OCO}
     *
     * @param {object} [options]
     * @param {string} [options.isIsolated] - For isolated margin or not, "TRUE", "FALSE", default "FALSE"
     * @param {string} [options.symbol] - Mandatory for isolated margin, not supported for cross margin
     * @param {number} [options.fromId] - If provided, neither startTime nor endTime can be sent
     * @param {number} [options.startTime]
     * @param {number} [options.endTime]
     * @param {number} [options.limit] - Default Value: 500; Max Value: 1000
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    getMarginOCOOrders(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/allOrderList',
            options
        )
    }

    /**
     * Query Margin Account's Open OCO (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/openOrderList<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Query-Margin-Account-Open-OCO}
     *
     * @param {object} [options]
     * @param {string} [options.isIsolated] - For isolated margin or not, "TRUE", "FALSE", default "FALSE"
     * @param {string} [options.symbol] - Mandatory for isolated margin, not supported for cross margin
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    getMarginOpenOCOOrders(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/openOrderList',
            options
        )
    }

    /**
     * Query Margin Account's Trade List (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/myTrades<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Query-Margin-Account-Trade-List}
     *
     * @param {string} symbol
     * @param {object} [options]
     * @param {string} [options.isIsolated] - Default 500; max 500.
     * @param {number} [options.startTime]
     * @param {number} [options.endTime]
     * @param {number} [options.fromId] - TradeId to fetch from. Default gets most recent trades.
     * @param {number} [options.limit] - Default 500; max 1000.
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginMyTrades(symbol, options = {}) {
        validateRequiredParameters({symbol})

        return this.signRequest(
            'GET',
            '/sapi/v1/margin/myTrades',
            Object.assign(options, {
                symbol: symbol.toUpperCase()
            })
        )
    }

    /**
     * Query Max Borrow (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/maxBorrowable<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/borrow-and-repay/Query-Max-Borrow}
     *
     * @param {string} asset
     * @param {object} [options]
     * @param {string} [options.isolatedSymbol]
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginMaxBorrowable(asset, options = {}) {
        validateRequiredParameters({asset})

        return this.signRequest(
            'GET',
            '/sapi/v1/margin/maxBorrowable',
            Object.assign(options, {
                asset: asset.toUpperCase()
            })
        )
    }

    /**
     * Query Max Transfer-Out Amount (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/maxTransferable<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/transfer/Query-Max-Transfer-Out-Amount}
     *
     * @param {string} asset
     * @param {object} [options]
     * @param {string} [options.isolatedSymbol]
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginMaxTransferable(asset, options = {}) {
        validateRequiredParameters({asset})

        return this.signRequest(
            'GET',
            '/sapi/v1/margin/maxTransferable',
            Object.assign(options, {
                asset: asset.toUpperCase()
            })
        )
    }

    /**
     * Query Margin Interest Rate History (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/interestRateHistory<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/borrow-and-repay/Query-Margin-Interest-Rate-History}
     *
     * @param {string} asset
     * @param {object} [options]
     * @param {number} [options.vipLevel] - Default: user's vip level
     * @param {number} [options.startTime] - Default: 7 days ago
     * @param {number} [options.endTime] - Default: present. Maximum range: 1 months.
     * @param {number} [options.recvWindow] - The value cannot be greater than 60000
     */
    marginInterestRateHistory(asset, options = {}) {
        validateRequiredParameters({asset})
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/interestRateHistory',
            Object.assign(options, {asset})
        )
    }

    /**
     * Query Isolated Margin Account Info (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/isolated/account<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/account/Query-Isolated-Margin-Account-Info}
     *
     * @param {object} [options]
     * @param {string} [options.symbols] - Max 5 symbols can be sent; separated by ",". e.g. "BTCUSDT,BNBUSDT,ADAUSDT"
     * @param {number} [options.recvWindow] - No more than 60000
     */
    isolatedMarginAccountInfo(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/isolated/account',
            options
        )
    }

    /**
     * Disable Isolated Margin Account (TRADE)<br>
     *
     * DELETE /sapi/v1/margin/isolated/account<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/account/Disable-Isolated-Margin-Account}
     *
     * @param {string} symbol
     * @param {object} [options]
     * @param {number} [options.recvWindow] - No more than 60000
     */
    disableIsolatedMarginAccount(symbol, options = {}) {
        validateRequiredParameters({symbol})
        return this.signRequest(
            'DELETE',
            '/sapi/v1/margin/isolated/account',
            Object.assign(options, {symbol})
        )
    }

    /**
     * Enable Isolated Margin Account (TRADE)<br>
     *
     * POST /sapi/v1/margin/isolated/account<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/account/Enable-Isolated-Margin-Account}
     *
     * @param {string} symbol
     * @param {object} [options]
     * @param {number} [options.recvWindow] - No more than 60000
     */
    enableIsolatedMarginAccount(symbol, options = {}) {
        validateRequiredParameters({symbol})
        return this.signRequest(
            'POST',
            '/sapi/v1/margin/isolated/account',
            Object.assign(options, {symbol})
        )
    }

    /**
     * Query Enabled Isolated Margin Account Limit (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/isolated/accountLimit<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/account/Query-Enabled-Isolated-Margin-Account-Limit}
     *
     * @param {object} [options]
     * @param {number} [options.recvWindow] - No more than 60000
     */
    isolatedMarginAccountLimit(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/isolated/accountLimit',
            options
        )
    }

    /**
     * Get All Isolated Margin Symbol(USER_DATA)<br>
     *
     * GET /sapi/v1/margin/isolated/allPairs<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/market-data/Get-All-Isolated-Margin-Symbol}
     *
     * @param {object} [options]
     * @param {number} [options.recvWindow] - No more than 60000
     */
    isolatedMarginAllSymbols(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/isolated/allPairs',
            options
        )
    }

    /**
     * Query Cross Margin Fee Data (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/crossMarginData<br>
     *
     * Get cross margin fee data collection with any vip level or user's current specific data as https://www.binance.com/en/margin-fee
     *
     * {@link https://developers.binance.com/docs/margin_trading/account/Query-Cross-Margin-Fee-Data}
     *
     * @param {object} [options]
     * @param {number} [options.vipLevel] - User's current specific margin data will be returned if vipLevel is omitted
     * @param {string} [options.coin]
     * @param {number} [options.recvWindow] - No more than 60000
     */
    marginFee(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/crossMarginData',
            options
        )
    }

    /**
     * Query Isolated Margin Fee Data (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/isolatedMarginData<br>
     *
     * Get isolated margin fee data collection with any vip level or user's current specific data as https://www.binance.com/en/margin-fee
     *
     * {@link https://developers.binance.com/docs/margin_trading/account/Query-Isolated-Margin-Fee-Data}
     *
     * @param {object} [options]
     * @param {number} [options.vipLevel] - User's current specific margin data will be returned if vipLevel is omitted
     * @param {string} [options.symbol]
     * @param {number} [options.recvWindow] - No more than 60000
     */
    isolatedMarginFee(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/isolatedMarginData',
            options
        )
    }

    /**
     * Query Isolated Margin Tier Data (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/isolatedMarginTier<br>
     *
     * Get isolated margin tier data collection with any tier as https://www.binance.com/en/margin-data
     *
     * {@link https://developers.binance.com/docs/margin_trading/account/Query-Isolated-Margin-Fee-Data}
     *
     * @param {string} symbol
     * @param {object} [options]
     * @param {string} [options.tier] - All margin tier data will be returned if tier is omitted
     * @param {number} [options.recvWindow] - No more than 60000
     */
    isolatedMarginTier(symbol, options = {}) {
        validateRequiredParameters({symbol})

        return this.signRequest(
            'GET',
            '/sapi/v1/margin/isolatedMarginTier',
            Object.assign(options, {symbol})
        )
    }

    /**
     * Query Current Margin Order Count Usage (TRADE)<br>
     *
     * GET /sapi/v1/margin/rateLimit/order<br>
     *
     * Displays the user's current margin order count usage for all intervals.
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Query-Current-Margin-Order-Count-Usage}
     *
     * @param {object} [options]
     * @param {string} [options.isIsolated] - for isolated margin or not, "TRUE", "FALSE"，default "FALSE"
     * @param {string} [options.symbol] - isolated symbol, mandatory for isolated margin
     * @param {number} [options.recvWindow] - No more than 60000
     */
    marginOrderCount(options = {}) {
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/rateLimit/order',
            options
        )
    }

    /**
     * Query Margin Available Inventory (USER_DATA)<br>
     *
     * GET /sapi/v1/margin/available-inventory<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/market-data/Query-margin-avaliable-inventory}
     *
     * @param {Type} type
     */
    queryMarginAvailableInventory(type, options = {}) {
        validateRequiredParameters({type})
        return this.signRequest(
            'GET',
            '/sapi/v1/margin/available-inventory',
            Object.assign(options, {
                type
            })
        )
    }

    /**
     * Margin manual liquidation (MARGIN)<br>
     *
     * POST /sapi/v1/margin/manual-liquidation<br>
     *
     * {@link https://developers.binance.com/docs/margin_trading/trade/Margin-Manual-Liquidation}
     *
     * @param {Type} type
     * @param {object} [options]
     * @param {string} [options.symbol]
     */
    marginManualLiquidation(type, options = {}) {
        validateRequiredParameters({type})
        return this.signRequest(
            'POST',
            '/sapi/v1/margin/manual-liquidation',
            Object.assign(options, {
                type
            })
        )
    }
}

module.exports = Margin
