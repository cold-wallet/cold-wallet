/** Failure codes of ccxtConnector.loadUserData that won't pass on a retry: the exchange rejected the
 *  keys (or they lack a permission), or ccxt doesn't know the exchange. */
export const CCXT_REJECTED = 401;
export const CCXT_UNKNOWN_EXCHANGE = 404;
