const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');

module.exports = {
  
    entry: [
        './js/game.js',
        './js/entities/entities.js',
        './js/entities/HUD.js',
        './js/screens/title.js',
        './js/screens/play.js',
        './js/screens/gameover.js',
        './js/screens/endgame.js',
        './src/login/login.js'
    ],
  
    output: {
        path: __dirname + '/dist/build',
        filename: 'bundle.js',
    },

    devServer: {
        static: path.join(__dirname, 'src'),
        port: 8000,
        open: true,
        hot: true
    },

    module: {
        rules: [
            {
              test: /\.scss$/,  /** or /\.css$/i if you aren't using sass */
              use: [
                {
                  loader: 'style-loader',
                  options: { 
                      insert: 'head', // insert style tag inside of <head>
                      injectType: 'singletonStyleTag' // this is for wrap all your style in just one style tag
                  },
                },
                "css-loader",
                "sass-loader"
              ],
            },
          ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/homepage/index.html'
        })
    ]
};