const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
    mode: 'production',
    entry: './src/dev/athena-dev.ts',
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/dev/index.html'
        }),
    ],
    output: {
        library: 'AthenaMindmap',
        libraryTarget: "var",
    },
    devtool: 'source-map'
});
