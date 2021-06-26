const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    output: {
        library: 'AthenaMindmap',
        libraryTarget: "var",
    },
    devtool: 'source-map'
});
