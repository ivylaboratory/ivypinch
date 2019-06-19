const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyPlugin = require('copy-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  watch: true,

  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000
  },

  plugins: [
    new WriteFilePlugin(),
    new CopyPlugin([
      {
        from: 'src/index.html',
        to: 'index.html',
      },
      {
        from: 'src/img/demo-image.jpg',
        to: 'img/demo-image.jpg',
      },
    ]),
  ],

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'ivypinch.js',
    libraryTarget: 'umd',
  }
});