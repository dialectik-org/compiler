//import rehypePrism from '@mapbox/rehype-prism';
//import remarkPrism from 'remark-prism'
import { remarkCodeFrame } from './plugins/remark/codeframe.mjs'
import { H5PWebpackPlugin } from './plugins/webpack/h5pwebpackplugin.mjs'
import { InjectExternalCssPlugin } from './plugins/webpack/injectstylewebpackplugin.mjs'
import { CompilerOptions, ReactProjectData, Task } from './types.mjs'
import { watch } from 'chokidar'
import CleanCSS from 'clean-css'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import { copyFileSync, readFileSync } from 'fs';
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
import TerserPlugin from 'terser-webpack-plugin'
import webpack from 'webpack';
import { Configuration as WebpackConfiguration, WebpackPluginInstance } from 'webpack';
import webpackDevServer from 'webpack-dev-server'
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import remarkAdmonitionBlock from './plugins/remark/admonition.mjs'

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

type FileMapping = {
  from: string;
  to: string;
};

/**
 * Generated by ChatGPT
 * Watches a list of source directories for changes and copies updated files to their respective destination directories.
 *
 * @param fileMappings - An array of FileMapping objects, each containing a 'from' field for the source directory and a 'to' field for the destination directory.
 *
 * Usage:
 * watchAndCopySourceFiles([
 *   {
 *     from: 'path/to/your/first/source',
 *     to: 'path/to/your/first/destination',
 *   },
 *   {
 *     from: 'path/to/your/second/source',
 *     to: 'path/to/your/second/destination',
 *   },
 *   // Add more source-destination pairs as needed
 * ]);
 */
function watchAndCopySourceFiles(fileMappings: FileMapping[]): void {
  fileMappings.forEach(({ from, to }) => {
    const watcher = watch(from, { ignoreInitial: true });

    watcher.on('all', (event : string, path : string) => {
      console.log(`File ${path} was ${event}, copying...`);
      copyFileSync(from, to);
      console.log(`Copied ${path} to ${to}`);
    });
  });
}

function getModule(project : ReactProjectData, coptions : CompilerOptions) {
  return {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader : coptions.modules.babelLoader,
        }
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader : coptions.modules.tsLoader,
          options: {
            configFile: join(project.dir, 'tsconfig.json'),
            // include other ts-loader options if necessary
            compilerOptions: {
              typeRoots: [coptions.modules.types],
            },
          },
        },
      },
      {
        test: /\.(css|scss)$/,
        use: [coptions.modules.styleLoader, coptions.modules.cssLoader],
      },
      {
        test: /\.(jpg|jpeg|png|gif|mp3|svg)$/,
        //type: 'asset/inline',
        //type: 'asset/resource',
        use: [coptions.modules.fileLoader],
        //parser: {
        //  dataUrlCondition: {
        //    maxSize: 20 * 1024 // 20kb
        //  }
        //}
      },
      {
        test: /\.(md|mdx)?$/,
        use: [
          {
            loader: coptions.modules.babelLoader,
          },
          {
            loader: coptions.modules.mdxLoader,
            /** @type {import('@mdx-js/loader').Options} */
            options: {
              remarkPlugins : [remarkEmbedImages, remarkFrontmatter,remarkMdx, remarkGfm, remarkMath, remarkCodeFrame, remarkAdmonitionBlock],
              rehypePlugins : [rehypeKatex, rehypeSlug, rehypePrismPlus]
            }
          }
        ]
      }
    ],
  }
}

function getPlugins(task : Task, project : ReactProjectData, coptions : CompilerOptions) : Array<WebpackPluginInstance> {
  const plugins : Array<WebpackPluginInstance> = []
  switch (task.targetType) {
    case 'HTML': {
      plugins.push(new HtmlWebpackPlugin({
        filename: project.targetName,
        title: project.title,
        template: project.index,
        inject: task.inlineJs ? 'body' : 'head',
        templateParameters: {
          'hasStyle' : !task.inlineCss && project.styles.length > 0,
          'hasKatex' : project.hasKatex,
          'hasPrism' : project.hasPrism,
          'katexCss' : coptions.katexCss,
          'prismCss' : join(coptions.prismCss, project.prismStyle),
          'customCss': project.styles.length > 0 ? basename(project.styles[0]) : ''
        }
      }))
      if (task.inlineJs) {
        plugins.push(new HtmlInlineScriptPlugin())
      }
      if (project.styles.length > 0) {
        if (task.inlineCss) {
          plugins.push(new InjectExternalCssPlugin(project))
        } else {
          plugins.push(new CopyWebpackPlugin({
            patterns: [
              { from: project.styles[0], to: basename(project.styles[0]) },
            ],
          }))
        }
      }
    }; break;
    case 'H5P': {
      plugins.push(new H5PWebpackPlugin(project))
    }
  }
  return plugins
}

function getDevServerConfig(project : ReactProjectData) {
  return {
    onBeforeSetupMiddleware: function (devServer : webpackDevServer) {
      if (!devServer) {
        throw new Error('Webpack Dev Server is not defined!');
      }
      watchAndCopySourceFiles(project.copy);
    },
    host: 'localhost',
    watchFiles: [`${project.dir}/*`],
    compress: true,
    port: 9000,
    open: true,
    hot: true,        // Add this line to enable HMR
    liveReload: true, // Add this line to enable live reload as a fallback
  }
}

function getConfiguration(task : Task, project : ReactProjectData, coptions : CompilerOptions, isDev : boolean) : Configuration {
  return {
    context: project.dir,
    entry  : project.main,
    output: {
      filename:   '[name].js',
      path:       project.targetDir,
      publicPath: isDev ? '/' : undefined,
    },
    mode:         isDev ? "development" : "production",
    devServer:    isDev ? getDevServerConfig(project) : undefined,
    resolve : {
      extensions: ['.tsx', '...'],
      modules:    [join(coptions.wDir, "node_modules"), "node_modules"],
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: task.license, // This line will remove the license-related comments
            },
          },
          extractComments: task.license, // This line will prevent creating a separate file for license comments
        }),
      ],
    },
    module : getModule(project, coptions),
    plugins : getPlugins(task, project, coptions),
    externals: {
      "react": "React",
      "react-dom": "ReactDOM",
    },
  }
}

export async function exec_webpack(task : Task, project : ReactProjectData, coptions : CompilerOptions) {
  const config = getConfiguration(task, project, coptions, false)
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

export function start_webpack_dev(task : Task, project : ReactProjectData, coptions : CompilerOptions) {
  const config = getConfiguration(task, project, coptions, true)
  console.log(JSON.stringify(config, null, 2))
  const compiler = webpack(config);
  if (config.devServer && config.devServer.port && config.devServer.host) {
    const server = new webpackDevServer(config.devServer, compiler);
    server.startCallback((err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      if (config.devServer)
        console.log(`Development server is running at http://${config.devServer.host}:${config.devServer.port}`);
    });
  }
}
