import { webpack, Configuration, DefinePlugin } from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { resolve } from 'path'
import { getEntries } from './utils'

async function getConfiguration(targets : string[], index : string) : Promise<Configuration> {
  const remarkMdx = await import('remark-mdx')
  const remarkGfm = await import('remark-gfm')
  const remarkMath = await import('remark-math')
  const rehypeKatex = await import('rehype-katex')

  return {
    entry  : getEntries(targets),
    output: {
      filename: '[name].js',
      path: __dirname + '/dist',
    },
    mode : "development",
    resolve : {
      extensions: ['.tsx', '...'],
      modules: [resolve(__dirname, "src"), "node_modules"],
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
          template: index,
      }),
      new DefinePlugin({ "process.env.API_URL": "\"http://localhost:8080\"" })
    ]
  }
}

export async function exec_webpack(targets : string[], index : string) {
  console.log(await getEntries(targets))
  /*
  const config = getConfiguration(targets, index)
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
      // ...
    });
  });
  */
}
