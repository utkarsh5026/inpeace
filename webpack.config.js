const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    background: './src/background.ts',
    popup: './src/popup.ts',
    blocked: './src/blocked.ts',
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
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'public/popup.html', to: 'popup.html' },
        { from: 'public/popup.css', to: 'popup.css' },
        { from: 'public/blocked.html', to: 'blocked.html' },
        { from: 'public/blocked.css', to: 'blocked.css' },
        { from: 'public/icons/icon16.png', to: 'icons/icon16.png' },
        { from: 'public/icons/icon48.png', to: 'icons/icon48.png' },
        { from: 'public/icons/icon128.png', to: 'icons/icon128.png' },
      ],
    }),
  ],
  optimization: {
    minimize: false, // Chrome extensions don't need minification and it helps with debugging
  },
};
