import webpack from 'webpack';
import { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin'
import HtmlInlineScriptPlugin from 'html-inline-script-webpack-plugin'
import { resolve } from 'path'
import { log, logError, target, options } from './utils.mjs'

import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter';
import remarkEmbedImages from 'remark-embed-images'
//import rehypePrism from '@mapbox/rehype-prism';
//import remarkPrism from 'remark-prism'
import { remarkCodeFrame } from './codeframe.mjs'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug';

import rehypePrismPlus from 'rehype-prism-plus'

import { unlinkSync } from 'fs';

//import { runPuppeteer } from './puppeteer.mjs';

export function getEntry(target : target) : { [index: string]: string } {
  const res : { [index: string]: string } = {}
  res[ target.bundleid ] = target.getMain()
  return res
}

function getConfiguration(target : target, dirname : string) : Configuration {
  return {
    entry  : getEntry(target),
    output: {
      filename: '[name].js',
      path: target.targetdir,
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
              //type: 'asset/inline',
              //type: 'asset/resource',
              use: ["file-loader"],
              //parser: {
              //  dataUrlCondition: {
              //    maxSize: 20 * 1024 // 20kb
              //  }
              //}
          },
          {
              test: /\.(md|mdx)?$/,
              use: [
                {loader: 'babel-loader', options: {}},
                {
                  loader: '@mdx-js/loader',
                  /** @type {import('@mdx-js/loader').Options} */
                  options: {
                      remarkPlugins : [remarkEmbedImages, remarkFrontmatter,remarkMdx, remarkGfm, remarkMath, remarkCodeFrame],
                      rehypePlugins : [rehypeKatex, rehypeSlug, rehypePrismPlus]
                  }
                }
              ]
          }
      ],
    },
    plugins : [
      new HtmlWebpackPlugin({
          title: target.title,
          template: target.getIndex(),
          inject: target.inline ? 'body' : 'head'
      }),
      //new webpack.DefinePlugin({ "process.env.API_URL": "\"http://localhost:8080\"" })
    ].concat(target.inline ? [(new HtmlInlineScriptPlugin()) as unknown as HtmlWebpackPlugin] : []),
    externals: {
      "react": "React",
      "react-dom": "ReactDOM",
    },
  }
}

export async function exec_webpack(target : target, dirname : string, o : options, idx : number) {
  const config = getConfiguration(target, dirname)
  const compiler = webpack(config)
  await compiler.run((err, stats) => {
    if (err) {
      console.log(err.stack || err)
      return;
    }
    target.bar?.increment()
    if (stats != undefined) {
      const info = stats.toJson()
      if (stats.hasErrors()) {
        console.log(info.errors)
      }
      if (stats.hasWarnings()) {
        console.log(info.warnings)
      }
      log(false,
        stats.toString({
          chunks: false, // Makes the build much quieter
          colors: true, // Shows colors in the console
        })
      );
    }
    compiler.close(async (closeErr) => {
      //await runPuppeteer(['/'], target.targetdir, idx)
      target.bar?.increment()
      // remove index file
      target.bar?.stop()
      unlinkSync(target.getMain())
      unlinkSync(target.getIndex())
      //unlinkSync(target.getTmpWd())
    });
  });
}
