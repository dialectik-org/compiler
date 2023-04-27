import webpack from 'webpack';
import pkg from 'webpack-sources';

const { RawSource } = pkg;

interface H5PWebpackPluginOptions {
  outputFilename?: string;
}

export class H5PWebpackPlugin {
  private options: H5PWebpackPluginOptions;
  private outputFilename: string;

  constructor(options?: H5PWebpackPluginOptions) {
    this.options = options || {};
    this.outputFilename = this.options.outputFilename || 'content.json';
  }

  public apply(compiler: webpack.Compiler): void {
    const pluginName = 'Base64EncodingPlugin';
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          // Get the generated JS file
          const generatedJSFile = Object.keys(compilation.assets)
            .filter((filename) => /\.js$/.test(filename))
            .pop();

          if (!generatedJSFile) {
            console.warn('No JavaScript file was found in the compilation assets.');
            return;
          }

          // Base64 encode the JS file content
          const fileContent = compilation.assets[generatedJSFile].source();
          const base64EncodedContent = Buffer.from(fileContent).toString('base64');

          // Create a JSON file with the encoded content
          const jsonOutput = JSON.stringify({ script: base64EncodedContent });

          // Add the JSON file to the compilation assets
          compilation.emitAsset(this.outputFilename, new RawSource(jsonOutput) as any);
        }
      );
    });
  }
}

