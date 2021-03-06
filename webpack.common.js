const path = require('path');

module.exports = {
    entry: './src/athena-mindmap.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'athena-mindmap.min.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
};