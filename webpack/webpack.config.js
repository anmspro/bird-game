const webpack = require("webpack");
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
    ],
  
    devtool: "source-map",
  
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },

    mode: 'none',

    // optimization: {
    //     minimize: true,
    // }
};