var webpack = require("webpack");
const path = require('path');
const autoprefixer = require('autoprefixer');

const babelLoader = {
  loader: 'babel-loader',
  options: {
    cacheDirectory: true,
  },
};

const tsConfigFilePath = path.resolve(__dirname, './tsconfig.json');

module.exports = {
  entry: [
    './src/ivypinch.ts'
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  devtool: 'source-map',
  module: {
    rules: [
      /* TypeScript */
      {
        test: /\.ts$/,
        use: [
          babelLoader,
          {
            loader: 'ts-loader',
            options: {configFile: tsConfigFilePath},
          },
        ],
      },

      /* JavaScript */
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
      }
    ],
  },
};