const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: './src/dev/athena-dev.ts',
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/dev/index.html'
        }),
    ],
    devServer: {
        contentBase: './dist',
    },
});
