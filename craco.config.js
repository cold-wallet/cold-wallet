const path = require('path');
const webpack = require('webpack');

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // Fix for react-refresh runtime import issue
            const scopePluginIndex = webpackConfig.resolve.plugins.findIndex(
                ({constructor}) => constructor && constructor.name === 'ModuleScopePlugin'
            );

            if (scopePluginIndex !== -1) {
                webpackConfig.resolve.plugins.splice(scopePluginIndex, 1);
            }

            // Add fallbacks for Node.js built-ins
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                crypto: require.resolve('crypto-browserify'),
                stream: require.resolve('stream-browserify'),
                assert: require.resolve('assert/'),
                http: require.resolve('stream-http'),
                https: require.resolve('https-browserify'),
                os: require.resolve('os-browserify/browser'),
                url: require.resolve('url/'),
                buffer: require.resolve('buffer/'),
                process: require.resolve('process/browser.js'),
                net: false,
                tls: false,
                fs: false,
                path: require.resolve('path-browserify'),
            };

            // Configure module resolution
            webpackConfig.resolve.extensions = [
                ...webpackConfig.resolve.extensions,
                '.js',
                '.jsx',
                '.ts',
                '.tsx',
            ];

            // Add alias for process
            webpackConfig.resolve.alias = {
                ...webpackConfig.resolve.alias,
                'process/browser': require.resolve('process/browser.js'),
            };

            // Add plugins for polyfills
            webpackConfig.plugins = [
                ...webpackConfig.plugins,
                new webpack.ProvidePlugin({
                    process: 'process/browser.js',
                    Buffer: ['buffer', 'Buffer'],
                }),
                new webpack.DefinePlugin({
                    'process.env': JSON.stringify(process.env),
                }),
            ];

            return webpackConfig;
        },
    },
    babel: {
        plugins: [
            ['@babel/plugin-proposal-private-property-in-object', {loose: true}],
        ],
    },
};
