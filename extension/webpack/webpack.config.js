const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist');

module.exports = {
  mode: 'production',
  entry: {
    'background/service_worker': path.join(srcDir, 'background', 'service_worker.ts'),
    'content_scripts/content_script': path.join(srcDir, 'content_scripts', 'content_script.ts'),
    'popup/popup': path.join(srcDir, 'popup', 'popup.tsx'),
  },
  output: {
    path: distDir,
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': srcDir,
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.join(__dirname, '..', 'manifest.json'), to: distDir },
        { from: path.join(__dirname, '..', 'assets'), to: path.join(distDir, 'assets') },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(srcDir, 'popup', 'popup.html'),
      filename: 'popup/popup.html',
      chunks: ['popup/popup'],
    }),
  ],
};
