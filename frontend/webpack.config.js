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
    fallback: {
      stream: require.resolve("stream-browserify"),
      util: require.resolve("util/"),
      crypto: require.resolve("crypto-browserify"),
      vm: require.resolve("vm-browserify"),
      buffer: require.resolve("buffer")
    },
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
        test: /\.(png|jpg|gif)$/i,
        use: [{
          loader: "url-loader",
          options: {
            encoding: "base64"
          }
        }]
      },
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "source-map-loader",
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
        type: "javascript/auto", //see https://github.com/webpack/webpack/issues/11467
      },
      {
        test: /\.(css|s[ac]ss)$/,
        use: ["style-loader", "css-loader"],
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
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],

};

module.exports = config;
