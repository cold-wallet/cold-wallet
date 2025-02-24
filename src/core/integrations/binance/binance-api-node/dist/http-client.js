Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deliveryCandleFields = exports.default = exports.candleFields = void 0;

var _crypto = _interopRequireDefault(require("./../../crypto-browserify"));

var _lodash = _interopRequireDefault(require("lodash.zipobject"));

var _httpsProxyAgent = _interopRequireDefault(require("https-proxy-agent"));

var _jsonBigint = _interopRequireDefault(require("json-bigint"));

require("isomorphic-fetch");
const {SimpleEarnLockedProductPositionResponse} = require("binance-api-node");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) {
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {value: value, enumerable: true, configurable: true, writable: true});
  } else {
    obj[key] = value;
  }
  return obj;
}

var BASE = 'https://api.binance.com';
var FUTURES = 'https://fapi.binance.com';
var COIN_FUTURES = 'https://dapi.binance.com';

var defaultGetTime = function defaultGetTime() {
  return Date.now();
};

var info = {
  spot: {},
  futures: {},
  delivery: {}
};
/**
 * Build query string for uri encoded url based on json object
 */

var makeQueryString = function makeQueryString(q) {
  return q ? "?".concat(Object.keys(q).map(function (k) {
    return "".concat(encodeURIComponent(k), "=").concat(encodeURIComponent(q[k]));
  }).join('&')) : '';
};
/**
 * Get API limits info from headers
 */


var headersMapping = {
  'x-mbx-used-weight-1m': 'usedWeight1m',
  'x-mbx-order-count-10s': 'orderCount10s',
  'x-mbx-order-count-1m': 'orderCount1m',
  'x-mbx-order-count-1h': 'orderCount1h',
  'x-mbx-order-count-1d': 'orderCount1d',
  'x-response-time': 'responseTime'
};

var responseHandler = function responseHandler(res) {
  if (!res.headers || !res.url) {
    return;
  }

  var marketName = res.url.includes(FUTURES) ? 'futures' : res.url.includes(COIN_FUTURES) ? 'delivery' : 'spot';
  Object.keys(headersMapping).forEach(function (key) {
    var outKey = headersMapping[key];

    if (res.headers.has(key)) {
      info[marketName][outKey] = res.headers.get(key);
    }
  });
};
/**
 * Finalize API response
 */


var sendResult = function sendResult(call) {
  return call.then(function (res) {
    // Get API limits info from headers
    responseHandler(res); // If response is ok, we can safely assume it is valid JSON

    if (res.ok) {
      return res.text().then(function (text) {
        return _jsonBigint.default.parse(text);
      });
    } // Errors might come from the API itself or the proxy Binance is using.
    // For API errors the response will be valid JSON,but for proxy errors
    // it will be HTML


    return res.text().then(function (text) {
      var error;

      try {
        var json = _jsonBigint.default.parse(text); // The body was JSON parseable, assume it is an API response error


        error = new Error(json.msg || "".concat(res.status, " ").concat(res.statusText));
        error.code = json.code;
        error.url = res.url;
      } catch (e) {
        // The body was not JSON parseable, assume it is proxy error
        error = new Error("".concat(res.status, " ").concat(res.statusText, " ").concat(text));
        error.response = res;
        error.responseText = text;
      }

      throw error;
    });
  });
};
/**
 * Util to validate existence of required parameter(s)
 */


var checkParams = function checkParams(name, payload) {
  var requires = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  if (!payload) {
    throw new Error('You need to pass a payload object.');
  }

  requires.forEach(function (r) {
    if (!payload[r] && isNaN(payload[r])) {
      throw new Error("Method ".concat(name, " requires ").concat(r, " parameter."));
    }
  });
  return true;
};
/**
 * Make public calls against the api
 *
 * @param {string} path Endpoint path
 * @param {object} data The payload to be sent
 * @param {string} method HTTB VERB, GET by default
 * @param {object} headers
 * @returns {object} The api response
 */


var publicCall = function publicCall(_ref) {
  var proxy = _ref.proxy,
      endpoints = _ref.endpoints;
  return function (path, data) {
    var method = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'GET';
    var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    return sendResult(fetch("".concat(path.includes('/fapi') || path.includes('/futures') ? endpoints.futures : path.includes('/dapi') ? endpoints.delivery : endpoints.base).concat(path).concat(makeQueryString(data)), _objectSpread({
      method: method,
      json: true,
      headers: headers
    }, proxy ? {
      agent: new _httpsProxyAgent.default(proxy)
    } : {})));
  };
};
/**
 * Factory method for partial private calls against the api
 *
 * @param {string} path Endpoint path
 * @param {object} data The payload to be sent
 * @param {string} method HTTB VERB, GET by default
 * @returns {object} The api response
 */


var keyCall = function keyCall(_ref2) {
  var apiKey = _ref2.apiKey,
      pubCall = _ref2.pubCall;
  return function (path, data) {
    var method = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'GET';

    if (!apiKey) {
      throw new Error('You need to pass an API key to make this call.');
    }

    return pubCall(path, data, method, {
      'X-MBX-APIKEY': apiKey
    });
  };
};
/**
 * Factory method for private calls against the api
 *
 * @param {string} path Endpoint path
 * @param {object} data The payload to be sent
 * @param {string} method HTTB VERB, GET by default
 * @param {object} headers
 * @returns {object} The api response
 */


var privateCall = function privateCall(_ref3) {
  var apiKey = _ref3.apiKey,
      apiSecret = _ref3.apiSecret,
      proxy = _ref3.proxy,
      endpoints = _ref3.endpoints,
      _ref3$getTime = _ref3.getTime,
      getTime = _ref3$getTime === void 0 ? defaultGetTime : _ref3$getTime,
      pubCall = _ref3.pubCall;
  return function (path) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var method = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'GET';
    var noData = arguments.length > 3 ? arguments[3] : undefined;
    var noExtra = arguments.length > 4 ? arguments[4] : undefined;

    if (!apiKey || !apiSecret) {
      throw new Error('You need to pass an API key and secret to make authenticated calls.');
    }

    return (data && data.useServerTime ? pubCall('/api/v3/time').then(function (r) {
      return r.serverTime;
    }) : Promise.resolve(getTime())).then(function (timestamp) {
      if (data) {
        delete data.useServerTime;
      }

      var signature = _crypto.default.createHmac('sha256', apiSecret).update(makeQueryString(_objectSpread(_objectSpread({}, data), {}, {
        timestamp: timestamp
      })).substr(1)).digest('hex');

      var newData = noExtra ? data : _objectSpread(_objectSpread({}, data), {}, {
        timestamp: timestamp,
        signature: signature
      });
      let url = "".concat(path.includes('/fapi') || path.includes('/futures') ? endpoints.futures : path.includes('/dapi') ? endpoints.delivery : endpoints.base).concat(path).concat(noData ? '' : makeQueryString(newData));
      let call = fetch(url, _objectSpread({
        method: method,
        headers: {
          'X-MBX-APIKEY': apiKey
        },
        json: true
      }, proxy ? {
        agent: new _httpsProxyAgent.default(proxy)
      } : {}));
      return sendResult(call);
    });
  };
};

var candleFields = ['openTime', 'open', 'high', 'low', 'close', 'volume', 'closeTime', 'quoteVolume', 'trades', 'baseAssetVolume', 'quoteAssetVolume'];
exports.candleFields = candleFields;
var deliveryCandleFields = ['openTime', 'open', 'high', 'low', 'close', 'volume', 'closeTime', 'baseVolume', 'trades', 'quoteAssetVolume', 'baseAssetVolume'];
/**
 * Get candles for a specific pair and interval and convert response
 * to a user friendly collection.
 */

exports.deliveryCandleFields = deliveryCandleFields;

var _candles = function candles(pubCall, payload) {
  var endpoint = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '/api/v3/klines';
  return checkParams('candles', payload, endpoint.includes('indexPrice') ? ['pair'] : ['symbol']) && pubCall(endpoint, _objectSpread({
    interval: '5m'
  }, payload)).then(function (candles) {
    return candles.map(function (candle) {
      return (0, _lodash.default)(!endpoint.includes('dapi') ? candleFields : deliveryCandleFields, candle);
    });
  });
};
/**
 * Create a new order wrapper for market order simplicity
 */


var _order = function order(privCall) {
  var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var url = arguments.length > 2 ? arguments[2] : undefined;
  var newPayload = ['LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'].includes(payload.type) || !payload.type ? _objectSpread({
    timeInForce: 'GTC'
  }, payload) : payload;
  var requires = ['symbol', 'side'];

  if (!(newPayload.type === 'MARKET' && newPayload.quoteOrderQty) && !(newPayload.type === 'STOP_MARKET') && !(newPayload.type === 'TAKE_PROFIT_MARKET') && !(newPayload.type === 'TRAILING_STOP_MARKET')) {
    requires.push('quantity');
  }

  if (newPayload.type === 'TRAILING_STOP_MARKET') {
    requires.push('callbackRate');
  }

  return checkParams('order', newPayload, requires) && privCall(url, _objectSpread({
    type: 'LIMIT'
  }, newPayload), 'POST');
};

var _orderOco = function orderOco(privCall) {
  var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var url = arguments.length > 2 ? arguments[2] : undefined;
  var newPayload = payload.stopLimitPrice && !payload.stopLimitTimeInForce ? _objectSpread({
    stopLimitTimeInForce: 'GTC'
  }, payload) : payload;
  return checkParams('order', newPayload, ['symbol', 'side', 'quantity', 'price', 'stopPrice']) && privCall(url, newPayload, 'POST');
};
/**
 * Zip asks and bids reponse from order book
 */


var _book = function book(pubCall, payload) {
  var endpoint = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '/api/v3/depth';
  return checkParams('book', payload, ['symbol']) && pubCall(endpoint, payload).then(function (_ref4) {
    var lastUpdateId = _ref4.lastUpdateId,
        asks = _ref4.asks,
        bids = _ref4.bids;
    return {
      lastUpdateId: lastUpdateId,
      asks: asks.map(function (a) {
        return (0, _lodash.default)(['price', 'quantity'], a);
      }),
      bids: bids.map(function (b) {
        return (0, _lodash.default)(['price', 'quantity'], b);
      })
    };
  });
};

var _aggTrades = function aggTrades(pubCall, payload) {
  var endpoint = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '/api/v3/aggTrades';
  return checkParams('aggTrades', payload, ['symbol']) && pubCall(endpoint, payload).then(function (trades) {
    return trades.map(function (trade) {
      var transformed = {
        aggId: trade.a,
        symbol: payload.symbol,
        price: trade.p,
        quantity: trade.q,
        firstId: trade.f,
        lastId: trade.l,
        timestamp: trade.T,
        isBuyerMaker: trade.m
      };
      if (trade.M) transformed.wasBestPrice = trade.M;
      return transformed;
    });
  });
};

var _default = function _default(opts) {
  var endpoints = {
    base: opts && opts.httpBase || BASE,
    futures: opts && opts.httpFutures || FUTURES,
    delivery: opts && opts.httpDelivery || COIN_FUTURES
  };
  var pubCall = publicCall(_objectSpread(_objectSpread({}, opts), {}, {
    endpoints: endpoints
  }));
  var deliveryPubCall = publicCall(_objectSpread(_objectSpread({}, opts), {}, {
    endpoints: {
      futures: endpoints.delivery
    }
  }));
  var privCall = privateCall(_objectSpread(_objectSpread({}, opts), {}, {
    endpoints: endpoints,
    pubCall: pubCall
  }));
  var kCall = keyCall(_objectSpread(_objectSpread({}, opts), {}, {
    pubCall: pubCall
  }));
  return {
    getInfo: function getInfo() {
      return info;
    },
    ping: function ping() {
      return pubCall('/api/v3/ping').then(function () {
        return true;
      });
    },
    time: function time() {
      return pubCall('/api/v3/time').then(function (r) {
        return r.serverTime;
      });
    },
    exchangeInfo: function exchangeInfo(payload) {
      return pubCall('/api/v3/exchangeInfo', payload);
    },
    book: function book(payload) {
      return _book(pubCall, payload);
    },
    aggTrades: function aggTrades(payload) {
      return _aggTrades(pubCall, payload);
    },
    candles: function candles(payload) {
      return _candles(pubCall, payload);
    },
    trades: function trades(payload) {
      return checkParams('trades', payload, ['symbol']) && pubCall('/api/v3/trades', payload);
    },
    tradesHistory: function tradesHistory(payload) {
      return checkParams('tradesHitory', payload, ['symbol']) && kCall('/api/v3/historicalTrades', payload);
    },
    dailyStats: function dailyStats(payload) {
      return pubCall('/api/v3/ticker/24hr', payload);
    },
    prices: function prices(payload) {
      return pubCall('/api/v3/ticker/price', payload).then(function (r) {
        return (Array.isArray(r) ? r : [r]).reduce(function (out, cur) {
          return out[cur.symbol] = cur.price, out;
        }, {});
      });
    },
    avgPrice: function avgPrice(payload) {
      return pubCall('/api/v3/avgPrice', payload);
    },
    allBookTickers: function allBookTickers() {
      return pubCall('/api/v3/ticker/bookTicker').then(function (r) {
        return (Array.isArray(r) ? r : [r]).reduce(function (out, cur) {
          return out[cur.symbol] = cur, out;
        }, {});
      });
    },

    /**
     * Call unmanaged private call to Binance api; you need a key and secret
     */
    privateRequest: function privateRequest(method, url, payload) {
      return privCall(url, payload, method);
    },

    /**
     * Call unmanaged public call to Binance api
     */
    publicRequest: function publicRequest(method, url, payload) {
      return pubCall(url, payload, method);
    },
    order: function order(payload) {
      return _order(privCall, payload, '/api/v3/order');
    },
    orderOco: function orderOco(payload) {
      return _orderOco(privCall, payload, '/api/v3/order/oco');
    },
    orderTest: function orderTest(payload) {
      return _order(privCall, payload, '/api/v3/order/test');
    },
    getOrder: function getOrder(payload) {
      return privCall('/api/v3/order', payload);
    },
    getOrderOco: function getOrderOco(payload) {
      return privCall('/api/v3/orderList', payload);
    },
    cancelOrder: function cancelOrder(payload) {
      return privCall('/api/v3/order', payload, 'DELETE');
    },
    cancelOrderOco: function cancelOrderOco(payload) {
      return privCall('/api/v3/orderList', payload, 'DELETE');
    },
    cancelOpenOrders: function cancelOpenOrders(payload) {
      return privCall('/api/v3/openOrders', payload, 'DELETE');
    },
    openOrders: function openOrders(payload) {
      return privCall('/api/v3/openOrders', payload);
    },
    allOrders: function allOrders(payload) {
      return privCall('/api/v3/allOrders', payload);
    },
    allOrdersOCO: function allOrdersOCO(payload) {
      return privCall('/api/v3/allOrderList', payload);
    },
    accountInfo: function accountInfo(payload) {
      return privCall('/api/v3/account', payload);
    },
    myTrades: function myTrades(payload) {
      return privCall('/api/v3/myTrades', payload);
    },
    withdraw: function withdraw(payload) {
      return privCall('/sapi/v1/capital/withdraw/apply', payload, 'POST');
    },
    withdrawHistory: function withdrawHistory(payload) {
      return privCall('/sapi/v1/capital/withdraw/history', payload);
    },
    depositHistory: function depositHistory(payload) {
      return privCall('/sapi/v1/capital/deposit/hisrec', payload);
    },
    depositAddress: function depositAddress(payload) {
      return privCall('/sapi/v1/capital/deposit/address', payload);
    },
    tradeFee: function tradeFee(payload) {
      return privCall('/sapi/v1/asset/tradeFee', payload);
    },
    assetDetail: function assetDetail(payload) {
      return privCall('/sapi/v1/asset/assetDetail', payload);
    },
    accountSnapshot: function accountSnapshot(payload) {
      return privCall('/sapi/v1/accountSnapshot', payload);
    },
    universalTransfer: function universalTransfer(payload) {
      return privCall('/sapi/v1/asset/transfer', payload, 'POST');
    },
    universalTransferHistory: function universalTransferHistory(payload) {
      return privCall('/sapi/v1/asset/transfer', payload);
    },
    dustLog: function dustLog(payload) {
      return privCall('/sapi/v1/asset/dribblet', payload);
    },
    dustTransfer: function dustTransfer(payload) {
      return privCall('/sapi/v1/asset/dust', payload, 'POST');
    },
    accountCoins: function accountCoins(payload) {
      return privCall('/sapi/v1/capital/config/getall', payload);
    },
    getBnbBurn: function getBnbBurn(payload) {
      return privCall('/sapi/v1/bnbBurn', payload);
    },
    setBnbBurn: function setBnbBurn(payload) {
      return privCall('/sapi/v1/bnbBurn', payload, 'POST');
    },
    capitalConfigs: function capitalConfigs() {
      return privCall('/sapi/v1/capital/config/getall');
    },
    getDataStream: function getDataStream() {
      return privCall('/api/v3/userDataStream', null, 'POST', true);
    },
    keepDataStream: function keepDataStream(payload) {
      return privCall('/api/v3/userDataStream', payload, 'PUT', false, true);
    },
    closeDataStream: function closeDataStream(payload) {
      return privCall('/api/v3/userDataStream', payload, 'DELETE', false, true);
    },
    marginGetDataStream: function marginGetDataStream() {
      return privCall('/sapi/v1/userDataStream', null, 'POST', true);
    },
    marginKeepDataStream: function marginKeepDataStream(payload) {
      return privCall('/sapi/v1/userDataStream', payload, 'PUT', false, true);
    },
    marginCloseDataStream: function marginCloseDataStream(payload) {
      return privCall('/sapi/v1/userDataStream', payload, 'DELETE', false, true);
    },
    futuresGetDataStream: function futuresGetDataStream() {
      return privCall('/fapi/v1/listenKey', null, 'POST', true);
    },
    futuresKeepDataStream: function futuresKeepDataStream(payload) {
      return privCall('/fapi/v1/listenKey', payload, 'PUT', false, true);
    },
    futuresCloseDataStream: function futuresCloseDataStream(payload) {
      return privCall('/fapi/v1/listenKey', payload, 'DELETE', false, true);
    },
    deliveryGetDataStream: function deliveryGetDataStream() {
      return privCall('/dapi/v1/listenKey', null, 'POST', true);
    },
    deliveryKeepDataStream: function deliveryKeepDataStream(payload) {
      return privCall('/dapi/v1/listenKey', payload, 'PUT', false, true);
    },
    deliveryCloseDataStream: function deliveryCloseDataStream(payload) {
      return privCall('/dapi/v1/listenKey', payload, 'DELETE', false, true);
    },
    marginAllOrders: function marginAllOrders(payload) {
      return privCall('/sapi/v1/margin/allOrders', payload);
    },
    marginOrder: function marginOrder(payload) {
      return _order(privCall, payload, '/sapi/v1/margin/order');
    },
    marginOrderOco: function marginOrderOco(payload) {
      return _orderOco(privCall, payload, '/sapi/v1/margin/order/oco');
    },
    marginGetOrder: function marginGetOrder(payload) {
      return privCall('/sapi/v1/margin/order', payload);
    },
    marginCancelOrder: function marginCancelOrder(payload) {
      return privCall('/sapi/v1/margin/order', payload, 'DELETE');
    },
    marginOpenOrders: function marginOpenOrders(payload) {
      return privCall('/sapi/v1/margin/openOrders', payload);
    },
    marginAccountInfo: function marginAccountInfo(payload) {
      return privCall('/sapi/v1/margin/account', payload);
    },
    marginMyTrades: function marginMyTrades(payload) {
      return privCall('/sapi/v1/margin/myTrades', payload);
    },
    marginRepay: function marginRepay(payload) {
      return privCall('/sapi/v1/margin/repay', payload, 'POST');
    },
    marginLoan: function marginLoan(payload) {
      return privCall('/sapi/v1/margin/loan', payload, 'POST');
    },
    marginIsolatedAccount: function marginIsolatedAccount(payload) {
      return privCall('/sapi/v1/margin/isolated/account', payload);
    },
    marginMaxBorrow: function marginMaxBorrow(payload) {
      return privCall('/sapi/v1/margin/maxBorrowable', payload);
    },
    marginCreateIsolated: function marginCreateIsolated(payload) {
      return privCall('/sapi/v1/margin/isolated/create', payload, 'POST');
    },
    marginIsolatedTransfer: function marginIsolatedTransfer(payload) {
      return privCall('/sapi/v1/margin/isolated/transfer', payload, 'POST');
    },
    marginIsolatedTransferHistory: function marginIsolatedTransferHistory(payload) {
      return privCall('/sapi/v1/margin/isolated/transfer', payload);
    },
    disableMarginAccount: function disableMarginAccount(payload) {
      return privCall('/sapi/v1/margin/isolated/account', payload, 'DELETE');
    },
    enableMarginAccount: function enableMarginAccount(payload) {
      return privCall('/sapi/v1/margin/isolated/account', payload, 'POST');
    },
    getPortfolioMarginAccountInfo: function getPortfolioMarginAccountInfo() {
      return privCall('/sapi/v1/portfolio/account');
    },
    futuresPing: function futuresPing() {
      return pubCall('/fapi/v1/ping').then(function () {
        return true;
      });
    },
    futuresTime: function futuresTime() {
      return pubCall('/fapi/v1/time').then(function (r) {
        return r.serverTime;
      });
    },
    futuresExchangeInfo: function futuresExchangeInfo() {
      return pubCall('/fapi/v1/exchangeInfo');
    },
    futuresBook: function futuresBook(payload) {
      return _book(pubCall, payload, '/fapi/v1/depth');
    },
    futuresAggTrades: function futuresAggTrades(payload) {
      return _aggTrades(pubCall, payload, '/fapi/v1/aggTrades');
    },
    futuresMarkPrice: function futuresMarkPrice(payload) {
      return pubCall('/fapi/v1/premiumIndex', payload);
    },
    futuresAllForceOrders: function futuresAllForceOrders(payload) {
      return pubCall('/fapi/v1/allForceOrders', payload);
    },
    futuresLongShortRatio: function futuresLongShortRatio(payload) {
      return pubCall('/futures/data/globalLongShortAccountRatio', payload);
    },
    futuresCandles: function futuresCandles(payload) {
      return _candles(pubCall, payload, '/fapi/v1/klines');
    },
    futuresMarkPriceCandles: function futuresMarkPriceCandles(payload) {
      return _candles(pubCall, payload, '/fapi/v1/markPriceKlines');
    },
    futuresIndexPriceCandles: function futuresIndexPriceCandles(payload) {
      return _candles(pubCall, payload, '/fapi/v1/indexPriceKlines');
    },
    futuresTrades: function futuresTrades(payload) {
      return checkParams('trades', payload, ['symbol']) && pubCall('/fapi/v1/trades', payload);
    },
    futuresDailyStats: function futuresDailyStats(payload) {
      return pubCall('/fapi/v1/ticker/24hr', payload);
    },
    futuresPrices: function futuresPrices(payload) {
      return pubCall('/fapi/v1/ticker/price', payload).then(function (r) {
        return (Array.isArray(r) ? r : [r]).reduce(function (out, cur) {
          return out[cur.symbol] = cur.price, out;
        }, {});
      });
    },
    futuresAllBookTickers: function futuresAllBookTickers() {
      return pubCall('/fapi/v1/ticker/bookTicker').then(function (r) {
        return (Array.isArray(r) ? r : [r]).reduce(function (out, cur) {
          return out[cur.symbol] = cur, out;
        }, {});
      });
    },
    futuresFundingRate: function futuresFundingRate(payload) {
      return checkParams('fundingRate', payload, ['symbol']) && pubCall('/fapi/v1/fundingRate', payload);
    },
    futuresOrder: function futuresOrder(payload) {
      return _order(privCall, payload, '/fapi/v1/order');
    },
    futuresBatchOrders: function futuresBatchOrders(payload) {
      return privCall('/fapi/v1/batchOrders', payload, 'POST');
    },
    futuresGetOrder: function futuresGetOrder(payload) {
      return privCall('/fapi/v1/order', payload);
    },
    futuresCancelOrder: function futuresCancelOrder(payload) {
      return privCall('/fapi/v1/order', payload, 'DELETE');
    },
    futuresCancelAllOpenOrders: function futuresCancelAllOpenOrders(payload) {
      return privCall('/fapi/v1/allOpenOrders', payload, 'DELETE');
    },
    futuresCancelBatchOrders: function futuresCancelBatchOrders(payload) {
      return privCall('/fapi/v1/batchOrders', payload, 'DELETE');
    },
    futuresOpenOrders: function futuresOpenOrders(payload) {
      return privCall('/fapi/v1/openOrders', payload);
    },
    futuresAllOrders: function futuresAllOrders(payload) {
      return privCall('/fapi/v1/allOrders', payload);
    },
    futuresPositionRisk: function futuresPositionRisk(payload) {
      return privCall('/fapi/v2/positionRisk', payload);
    },
    futuresLeverageBracket: function futuresLeverageBracket(payload) {
      return privCall('/fapi/v1/leverageBracket', payload);
    },
    futuresAccountBalance: function futuresAccountBalance(payload) {
      return privCall('/fapi/v2/balance', payload);
    },
    futuresAccountInfo: function futuresAccountInfo(payload) {
      return privCall('/fapi/v2/account', payload);
    },
    futuresUserTrades: function futuresUserTrades(payload) {
      return privCall('/fapi/v1/userTrades', payload);
    },
    futuresPositionMode: function futuresPositionMode(payload) {
      return privCall('/fapi/v1/positionSide/dual', payload);
    },
    futuresPositionModeChange: function futuresPositionModeChange(payload) {
      return privCall('/fapi/v1/positionSide/dual', payload, 'POST');
    },
    futuresLeverage: function futuresLeverage(payload) {
      return privCall('/fapi/v1/leverage', payload, 'POST');
    },
    futuresMarginType: function futuresMarginType(payload) {
      return privCall('/fapi/v1/marginType', payload, 'POST');
    },
    futuresPositionMargin: function futuresPositionMargin(payload) {
      return privCall('/fapi/v1/positionMargin', payload, 'POST');
    },
    futuresMarginHistory: function futuresMarginHistory(payload) {
      return privCall('/fapi/v1/positionMargin/history', payload);
    },
    futuresIncome: function futuresIncome(payload) {
      return privCall('/fapi/v1/income', payload);
    },
    deliveryPing: function deliveryPing() {
      return pubCall('/dapi/v1/ping').then(function () {
        return true;
      });
    },
    deliveryTime: function deliveryTime() {
      return pubCall('/dapi/v1/time').then(function (r) {
        return r.serverTime;
      });
    },
    deliveryExchangeInfo: function deliveryExchangeInfo() {
      return pubCall('/dapi/v1/exchangeInfo');
    },
    deliveryBook: function deliveryBook(payload) {
      return _book(pubCall, payload, '/dapi/v1/depth');
    },
    deliveryAggTrades: function deliveryAggTrades(payload) {
      return _aggTrades(pubCall, payload, '/dapi/v1/aggTrades');
    },
    deliveryMarkPrice: function deliveryMarkPrice(payload) {
      return pubCall('/dapi/v1/premiumIndex', payload);
    },
    deliveryAllForceOrders: function deliveryAllForceOrders(payload) {
      return pubCall('/dapi/v1/allForceOrders', payload);
    },
    deliveryLongShortRatio: function deliveryLongShortRatio(payload) {
      return deliveryPubCall('/futures/data/globalLongShortAccountRatio', payload);
    },
    deliveryCandles: function deliveryCandles(payload) {
      return _candles(pubCall, payload, '/dapi/v1/klines');
    },
    deliveryMarkPriceCandles: function deliveryMarkPriceCandles(payload) {
      return _candles(pubCall, payload, '/dapi/v1/markPriceKlines');
    },
    deliveryIndexPriceCandles: function deliveryIndexPriceCandles(payload) {
      return _candles(pubCall, payload, '/dapi/v1/indexPriceKlines');
    },
    deliveryTrades: function deliveryTrades(payload) {
      return checkParams('trades', payload, ['symbol']) && pubCall('/dapi/v1/trades', payload);
    },
    deliveryDailyStats: function deliveryDailyStats(payload) {
      return pubCall('/dapi/v1/ticker/24hr', payload);
    },
    deliveryPrices: function deliveryPrices() {
      return pubCall('/dapi/v1/ticker/price').then(function (r) {
        return (Array.isArray(r) ? r : [r]).reduce(function (out, cur) {
          return out[cur.symbol] = cur.price, out;
        }, {});
      });
    },
    deliveryAllBookTickers: function deliveryAllBookTickers() {
      return pubCall('/dapi/v1/ticker/bookTicker').then(function (r) {
        return (Array.isArray(r) ? r : [r]).reduce(function (out, cur) {
          return out[cur.symbol] = cur, out;
        }, {});
      });
    },
    deliveryFundingRate: function deliveryFundingRate(payload) {
      return checkParams('fundingRate', payload, ['symbol']) && pubCall('/dapi/v1/fundingRate', payload);
    },
    deliveryOrder: function deliveryOrder(payload) {
      return _order(privCall, payload, '/dapi/v1/order');
    },
    deliveryBatchOrders: function deliveryBatchOrders(payload) {
      return privCall('/dapi/v1/batchOrders', payload, 'POST');
    },
    deliveryGetOrder: function deliveryGetOrder(payload) {
      return privCall('/dapi/v1/order', payload);
    },
    deliveryCancelOrder: function deliveryCancelOrder(payload) {
      return privCall('/dapi/v1/order', payload, 'DELETE');
    },
    deliveryCancelAllOpenOrders: function deliveryCancelAllOpenOrders(payload) {
      return privCall('/dapi/v1/allOpenOrders', payload, 'DELETE');
    },
    deliveryCancelBatchOrders: function deliveryCancelBatchOrders(payload) {
      return privCall('/dapi/v1/batchOrders', payload, 'DELETE');
    },
    deliveryOpenOrders: function deliveryOpenOrders(payload) {
      return privCall('/dapi/v1/openOrders', payload);
    },
    deliveryAllOrders: function deliveryAllOrders(payload) {
      return privCall('/dapi/v1/allOrders', payload);
    },
    deliveryPositionRisk: function deliveryPositionRisk(payload) {
      return privCall('/dapi/v1/positionRisk', payload);
    },
    deliveryLeverageBracket: function deliveryLeverageBracket(payload) {
      return privCall('/dapi/v1/leverageBracket', payload);
    },
    deliveryAccountBalance: function deliveryAccountBalance(payload) {
      return privCall('/dapi/v1/balance', payload);
    },
    deliveryAccountInfo: function deliveryAccountInfo(payload) {
      return privCall('/dapi/v1/account', payload);
    },
    deliveryUserTrades: function deliveryUserTrades(payload) {
      return privCall('/dapi/v1/userTrades', payload);
    },
    deliveryPositionMode: function deliveryPositionMode(payload) {
      return privCall('/dapi/v1/positionSide/dual', payload);
    },
    deliveryPositionModeChange: function deliveryPositionModeChange(payload) {
      return privCall('/dapi/v1/positionSide/dual', payload, 'POST');
    },
    deliveryLeverage: function deliveryLeverage(payload) {
      return privCall('/dapi/v1/leverage', payload, 'POST');
    },
    deliveryMarginType: function deliveryMarginType(payload) {
      return privCall('/dapi/v1/marginType', payload, 'POST');
    },
    deliveryPositionMargin: function deliveryPositionMargin(payload) {
      return privCall('/dapi/v1/positionMargin', payload, 'POST');
    },
    deliveryMarginHistory: function deliveryMarginHistory(payload) {
      return privCall('/dapi/v1/positionMargin/history', payload);
    },
    deliveryIncome: function deliveryIncome(payload) {
      return privCall('/dapi/v1/income', payload);
    },
    getMultiAssetsMargin: function getMultiAssetsMargin(payload) {
      return privCall('/fapi/v1/multiAssetsMargin', payload);
    },
    setMultiAssetsMargin: function setMultiAssetsMargin(payload) {
      return privCall('/fapi/v1/multiAssetsMargin', payload, 'POST');
    },
    lendingAccount: function lendingAccount(payload) {
      return privCall('/sapi/v1/lending/union/account', payload);
    },
    getSimpleEarnFlexibleProductPosition: function getSimpleEarnFlexibleProductPosition(payload) {
      return privCall('/sapi/v1/simple-earn/flexible/position', payload);
    },
    getSimpleEarnLockedProductPosition: function getSimpleEarnLockedProductPosition(payload) {
        return privCall('/sapi/v1/simple-earn/locked/position', payload);
    },
    fundingWallet: function fundingWallet(payload) {
      return privCall('/sapi/v1/asset/get-funding-asset', payload, 'POST');
    },
    apiPermission: function apiPermission(payload) {
      return privCall('/sapi/v1/account/apiRestrictions', payload);
    }
  };
};

exports.default = _default;
