const { merge } = require("webpack-merge");
const path = require("path");
const nodeExternals = require("webpack-node-externals");

const webpackBaseConfig = {
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: require.resolve("babel-loader"),
      },
    ],
  },
  output: {
    filename: "index.js",
    publicPath: "/",
    libraryTarget: "commonjs",
  },
};

const webpackClientConfig = merge(webpackBaseConfig, {
  entry: {
    client: "./src/client",
  },
  output: {
    path: path.resolve(__dirname, "dist/client"),
  },
});

const webpackServerConfig = merge(webpackBaseConfig, {
  entry: {
    server: "./src/server",
  },
  target: "node",
  output: {
    path: path.resolve(__dirname, "dist/server"),
  },
});

const webpackMainConfig = merge(webpackBaseConfig, {
  entry: {
    main: "./src",
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
});

module.exports = [webpackClientConfig, webpackServerConfig, webpackMainConfig];
