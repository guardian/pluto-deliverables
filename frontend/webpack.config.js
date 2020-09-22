var webpack = require("webpack");
var path = require("path");
var TerserPlugin = require("terser-webpack-plugin");
var svgToMiniDataUri = require("mini-svg-data-uri");

var BUILD_DIR = path.resolve(__dirname, "../gnm_deliverables/static");
var APP_DIR = path.resolve(__dirname, "app");

var config = {
  entry: `${APP_DIR}/index.jsx`,
  output: {
    path: BUILD_DIR,
    filename: "app.js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  optimization: {
    minimizer: [new TerserPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.[tj]sx?/,
        include: APP_DIR,
        loader: "ts-loader",
      },
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "source-map-loader",
      },
      {
        test: /\.(css|s[ac]ss)$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: {
          loader: "url-loader",
          options: {
            limit: 100000,
          },
        },
      },
      {
        test: /\.svg$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              generator: (content) => svgToMiniDataUri(content.toString()),
            },
          },
        ],
      }
    ],
  },
  devtool: "source-map",
};

module.exports = config;
