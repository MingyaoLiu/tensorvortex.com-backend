
const CopyPlugin = require('copy-webpack-plugin');

const path = require('path') ;

module.exports = {
    entry: {
        server: path.join(__dirname, 'src/server.ts'),
    },
    output: {
        path: path.join(__dirname, '../dist/server/'),
        publicPath: '/',
        filename: '[name].js'
    },
    target: 'node',
    resolve: {
        // Add '.ts' and '.tsx' as a resolvable extension.
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    },
    node: {
        // Need this when working with express, otherwise the build fails
        __dirname: false,   // if you don't put this is, __dirname
        __filename: false,  // and __filename return blank or /
    },
    // externals: [nodeExternals()], // Need this to avoid error when working with Express
    module: {
        rules: [
            {
                // Transpiles ES6-8 into ES5
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader'
                }
            }
        ]
    },
    plugins: [

        new CopyPlugin({
            patterns: [
                {
                    from: 'src/secrets/cert',
                    to: 'secrets/cert',
                    toType: 'dir',
                },
            ],
        })
    ]
};