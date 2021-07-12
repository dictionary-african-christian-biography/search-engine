const path = require('path');

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

const outputPath = path.resolve(__dirname, '../source/assets/js/search-engine/');
const backwardsCompatibleOutputPath = path.resolve(__dirname, 'dist/');

module.exports = [
  {
    ...defaultConfig,
    entry: './src/client/search.js',
    output: {
      path: outputPath,
      filename: 'search.bundle.js',
    },
  },
  {
    ...defaultConfig,
    entry: './src/client/search-lightweight.js',
    output: {
      path: outputPath,
      filename: 'search-lightweight.bundle.js',
    },
  },
  // backwards compatible version
  {
    ...defaultConfig,
    entry: './src/client/search.js',
    output: {
      path: backwardsCompatibleOutputPath,
      filename: 'search.bundle.js',
    },
  },
  {
    ...defaultConfig,
    entry: './src/client/search-lightweight.js',
    output: {
      path: backwardsCompatibleOutputPath,
      filename: 'search-lightweight.bundle.js',
    },
  },
];
