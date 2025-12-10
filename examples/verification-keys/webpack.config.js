// webpack.config.js - The fully corrected and API-compliant configuration
const path = require('path');

module.exports = {
  // CRITICAL: Targets Node.js runtime (resolves fs/crypto errors)
  target: 'node',
  mode: 'development',
  devtool: 'inline-source-map',

  entry: './src/index.ts',

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    // CRITICAL: Ensures the output is loadable by Node.js
    library: {
      type: 'commonjs2',
    },
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.js', '.json', '.wasm'],
  },

  module: {
    rules: [
      // Rule 1: Handle TypeScript files
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // CRITICAL FIX: Rule 2: Handle WebAssembly files
      {
        test: /\.wasm$/,
        // CRITICAL: Use webassembly/async for native module handling
        type: 'webassembly/async',
        // **The fix for the named export warnings is NOT here**
        // It relies on the 'type' and the 'experiments' flags working together.
      },
    ],
  },

  // CRITICAL: Enables WASM module loading functionality
  experiments: {
    asyncWebAssembly: true,
    // CRITICAL: Ensures that all ES Module imports are correctly handled,
    // which often resolves named export issues in WASM glue code.
    topLevelAwait: true,
  },
};
