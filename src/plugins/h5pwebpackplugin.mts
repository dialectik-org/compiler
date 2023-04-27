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
    compiler.hooks.emit.tapAsync('H5PWebpackPlugin', (compilation, callback) => {
      // Get the generated JS file
      const generatedJSFile = Object.keys(compilation.assets)
        .filter((filename) => /\.js$/.test(filename))
        .pop();

      if (!generatedJSFile) {
        console.warn('No JavaScript file was found in the compilation assets.');
        callback();
        return;
      }

      // Base64 encode the JS file content
      const fileContent = compilation.assets[generatedJSFile].source();
      const base64EncodedContent = Buffer.from(fileContent).toString('base64');

      // Create a JSON file with the encoded content
      const jsonOutput = JSON.stringify({ script: base64EncodedContent });

      // Add the JSON file to the compilation assets
      compilation.assets[this.outputFilename] = new RawSource(jsonOutput) as any;

      callback();
    });
  }
}

