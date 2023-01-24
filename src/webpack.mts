import webpack from 'webpack';
import { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin'
import HtmlInlineScriptPlugin from 'html-inline-script-webpack-plugin'
import { resolve } from 'path'
import { log, logError, target, options } from './utils.mjs'
import { join } from 'path';


import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkFrontmatter from 'remark-frontmatter';
import { unlinkSync } from 'fs';
import { SingleBar } from 'cli-progress';

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
      path: target.resdir,
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
                      remarkPlugins : [remarkMdx, remarkFrontmatter, remarkGfm, remarkMath],
                      rehypePlugins : [rehypeKatex]
                  }
                }
              ]
          }
      ],
    },
    plugins : [
      new HtmlWebpackPlugin({
          title: target.mdoptions.title,
          template: indexhtml,
          inject: target.mdoptions.inline ? 'body' : 'head'
      }),
      //new webpack.DefinePlugin({ "process.env.API_URL": "\"http://localhost:8080\"" })
    ].concat(target.mdoptions.inline ? [(new HtmlInlineScriptPlugin()) as unknown as HtmlWebpackPlugin] : [])
  }
}

export function exec_webpack(target : target, index : string, dirname : string, o : options) {
  const config = getConfiguration(target, index, dirname)
  const compiler = webpack(config)
  compiler.run((err, stats) => {
    if (err) {
      logError(o, err.stack || err)
      return;
    }
    target.bar.increment(1)
    if (stats != undefined) {
      const info = stats.toJson()
      if (stats.hasErrors()) {
        logError({ ...o, verbose : true }, info.errors)
      }
      if (stats.hasWarnings()) {
        log({ ...o, verbose : true }, info.warnings)
      }
      log(o,
        stats.toString({
          chunks: false, // Makes the build much quieter
          colors: true, // Shows colors in the console
        })
      );
    }
    compiler.close((closeErr) => {
      // remove index file
      target.bar.stop()
      unlinkSync(target.maintsx)
    });
  });
}
