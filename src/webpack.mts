import webpack from 'webpack';
import { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin'
import HtmlInlineScriptPlugin from 'html-inline-script-webpack-plugin'
import { resolve } from 'path'
import { target } from './utils.mjs'
import { join } from 'path';


import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { unlinkSync } from 'fs';

export function getEntry(target : target) : { [index: string]: string } {
  const res : { [index: string]: string } = {}
  res[ target.bundleid ] = target.maintsx
  return res
}

function getConfiguration(target : target, indexhtml : string, dirname : string) : Configuration {
  return {
    entry  : getEntry(target),
    output: {
      filename: '[name].js',
      path: join(dirname, 'build', target.bundleid),
    },
    mode : "production",
    resolve : {
      extensions: ['.tsx', '...'],
      modules: [resolve(dirname, "src"), "node_modules"],
    },
    //devServer: { static: path.join(__dirname, "src") },
    module : {
      rules: [
          {
              test: /\.(js|jsx)$/,
              exclude: /node_modules/,
              use: ["babel-loader"]
          },
          {
            test: /\.(ts|tsx)$/,
            exclude: /node_modules/,
            use: ["ts-loader"],
          },
          {
              test: /\.(css|scss)$/,
              use: ["style-loader", "css-loader"],
          },
          {
              test: /\.(jpg|jpeg|png|gif|mp3|svg)$/,
              use: ["file-loader"]
          },
          {
              test: /\.(md|mdx)?$/,
              use: [
                {loader: 'babel-loader', options: {}},
                {
                  loader: '@mdx-js/loader',
                  /** @type {import('@mdx-js/loader').Options} */
                  options: {
                      remarkPlugins : [remarkMdx, remarkGfm, remarkMath],
                      rehypePlugins : [rehypeKatex]
                  }
                }
              ]
          }
      ],
    },
    plugins : [
      new HtmlWebpackPlugin({
          title: "My Web App",
          template: indexhtml,
          inject: 'body'
      }),
      new HtmlInlineScriptPlugin()
      //new webpack.DefinePlugin({ "process.env.API_URL": "\"http://localhost:8080\"" })
    ]
  }
}

export function exec_webpack(target : target, index : string, dirname : string) {
  const config = getConfiguration(target, index, dirname)
  const compiler = webpack(config)
  compiler.run((err, stats) => {
    if (err) {
      console.error(err.stack || err)
      return;
    }
    if (stats != undefined) {
      const info = stats.toJson()
      if (stats.hasErrors()) {
        console.error(info.errors)
      }
      if (stats.hasWarnings()) {
        console.warn(info.warnings)
      }
      console.log(
        stats.toString({
          chunks: false, // Makes the build much quieter
          colors: true, // Shows colors in the console
        })
      );
    }
    compiler.close((closeErr) => {
      // remove index file
      unlinkSync(target.maintsx)
    });
  });
}
