const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    entry: './src/dev/athena-dev.ts',
    output: {
        library: 'AthenaMindmap',
        libraryTarget: "var",
    },
    devtool: 'source-map'
});
