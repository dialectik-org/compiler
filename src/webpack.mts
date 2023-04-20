//import rehypePrism from '@mapbox/rehype-prism';
//import remarkPrism from 'remark-prism'
import { remarkCodeFrame } from './codeframe.mjs'
import { CompilerOptions, ReactProjectData } from './types.mjs'
import CleanCSS from 'clean-css'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import { readFileSync } from 'fs';
import HtmlInlineScriptPlugin from 'html-inline-script-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { basename, join } from 'path'
import rehypeKatex from 'rehype-katex'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypeSlug from 'rehype-slug';
import remarkEmbedImages from 'remark-embed-images'
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkMdx from 'remark-mdx'
import webpack from 'webpack';
import { Configuration } from 'webpack';

function getConfiguration(id: string, project : ReactProjectData, coptions : CompilerOptions) : Configuration {
  return {
    entry  : project.main,
    output: {
      filename: '[name].js',
      path: join(coptions.targetDir, id),
    },
    mode : "production",
    resolve : {
      extensions: ['.tsx', '...'],
      modules: [project.dir, "node_modules"],
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
        title: project.title,
        template: project.index,
        inject: project.inlineJs ? 'body' : 'head',
        templateParameters: {
          'hasStyle' : !project.inlineCss && project.styles.length > 0,
          'hasKatex' : project.hasKatex,
          'hasPrism' : project.hasPrism,
          'katexCss' : coptions.katexCss,
          'prismCss' : join(coptions.prismCss, project.prismStyle),
          'customCss': project.styles.length > 0 ? basename(project.styles[0]) : ''
        }
      }),
      //new webpack.DefinePlugin({ "process.env.API_URL": "\"http://localhost:8080\"" })
    ].concat(project.inlineJs ? [
      (new HtmlInlineScriptPlugin()) as unknown as HtmlWebpackPlugin
    ] : [])
    .concat(project.inlineCss && project.styles.length > 0 ? [
      {
        apply: (compiler : any) => {
          compiler.hooks.compilation.tap('InjectExternalCss', (compilation : any) => {
            HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
              'InjectExternalCss',
              (data, cb) => {
                const cssFilePath = project.styles[0]; // Replace with the actual path to your CSS file
                const cssContent = readFileSync(cssFilePath, 'utf-8');
                const cleanCSS = new CleanCSS();
                const minifiedCSS = cleanCSS.minify(cssContent);
                const styleTag = `<style>${minifiedCSS.styles}</style>`;
                data.html = data.html.replace('</body>', `${styleTag}</body>`);
                cb(null, data);
              }
            );
          });
        },
      } as unknown as HtmlWebpackPlugin
    ] : [])
    .concat(!project.inlineCss && project.styles.length > 0 ? [
      new CopyWebpackPlugin({
        patterns: [
          { from: project.styles[0], to: basename(project.styles[0]) },
        ],
      })
    ] as unknown as HtmlWebpackPlugin : []),
    externals: {
      "react": "React",
      "react-dom": "ReactDOM",
    },
  }
}

export async function exec_webpack(id : string, project : ReactProjectData, coptions : CompilerOptions) {
  const config = getConfiguration(id, project, coptions)
  //console.log(JSON.stringify(config, null, 2))
  const compiler = webpack(config)
  await compiler.run((err, stats) => {
    if (err) {
      console.log(err.stack || err)
      return;
    }
    if (stats != undefined) {
      if (stats.hasErrors() || stats.hasWarnings()) {
        console.log(
          stats.toString({
            chunks: false, // Makes the build much quieter
            colors: true, // Shows colors in the console
          })
        );
      }
    }
    compiler.close(async (closeErr) => {
      // remove index file
      //unlinkSync(target.getMain())
      //unlinkSync(target.getIndex())
      //unlinkSync(target.getTmpWd())
    });
  });
}
