const path = require('path');
const compileSearchData = require('./src/compile');

compileSearchData();

const defaultConfig = {
  devServer: {
    stats: {
      colors: true,
      hash: false,
      version: false,
      timings: false,
      assets: false,
      chunks: false,
      modules: false,
      reasons: false,
      children: false,
      source: false,
      errors: false,
      errorDetails: false,
      warnings: false,
      publicPath: false,
    },
  },
  mode: 'production',
};

module.exports = [
  {
    ...defaultConfig,
    entry: './src/client/search.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'search.bundle.js',
    },
  },
  {
    ...defaultConfig,
    entry: './src/client/search-lightweight.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'search-lightweight.bundle.js',
    },
  },
];
