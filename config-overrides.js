const webpack = require('webpack');

module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        'process/browser': require.resolve('process/browser'),
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "cipher": require.resolve("browserify-cipher"),
        "assert": false,// require.resolve("assert"),
        "http": false,// require.resolve("stream-http"),
        "https": false,// require.resolve("https-browserify"),
        "os": false,// require.resolve("os-browserify"),
        "url": false,// require.resolve("url"),
        "tls": false,// require.resolve("tls-browserify"),
        "net": false,// require.resolve("net-browserify"),
        "zlib": false,// require.resolve("browserify-zlib"),
        "querystring": false,// require.resolve("querystring-es3"),
        "path": false,// require.resolve("path-browserify"),
        "fs": false,
        "async_hooks": false,
    })
    config.resolve.fallback = fallback;
    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ])
    config.ignoreWarnings = [/Failed to parse source map/];
    return config;
}
