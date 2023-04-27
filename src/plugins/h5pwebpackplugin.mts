import { ReactProjectData } from '../types.mjs';
import { writeFileSync, createWriteStream, readFileSync } from 'fs';
import { join } from 'path';
import webpack from 'webpack';
import { Source } from 'webpack-sources'
import { mkOrCleanDir, lowerFirstLetter } from '../fsutils.mjs';
import archiver from 'archiver';

class BinarySource implements Source {
  private _buffer: Buffer;

  constructor(buffer: Buffer) {
    this._buffer = buffer;
  }

  source(): Buffer {
    return this._buffer;
  }

  size(): number {
    return this._buffer.length;
  }

  buffer(): Buffer {
    return this._buffer;
  }

  map(options?: any): any {
    return {};
  }

  sourceAndMap(options?: any): { source: Buffer; map: any } {
    return { source: this.source(), map: this.map() };
  }

  updateHash(hash: any): void {
    hash.update(this._buffer);
  }
}

interface H5PWebpackPluginOptions {
  outputFilename?: string;
}

export class H5PWebpackPlugin {
  private options: H5PWebpackPluginOptions;
  private outputFilename: string;
  private project: ReactProjectData;

  constructor(project : ReactProjectData, options?: H5PWebpackPluginOptions) {
    this.project = project;
    this.options = options || {};
    this.outputFilename = this.options.outputFilename || 'content.json';
  }

  public apply(compiler: webpack.Compiler): void {
    const pluginName = 'Base64EncodingPlugin';
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      let generatedJSFile: string | undefined;
      compilation.hooks.processAssets.tapPromise(
        {
          name: pluginName,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        async () => {
          // Get the generated JS file
          generatedJSFile = Object.keys(compilation.assets)
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

          // Prepare the temporary directory
          const tmpComponentPath = join(this.project.dir, 'component');
          const tmpContentPath = join(tmpComponentPath, 'content')
          const contentJsonPath = join(tmpContentPath, 'content.json');
          mkOrCleanDir(tmpContentPath);

          // Write content.json
          writeFileSync(contentJsonPath, jsonOutput);

          // Write h5p.json to the temporary directory
          const h5pjsonContent = {
            title: this.project.title,
            language: "und",
            mainLibrary: "H5P.Dialectik",
            embedTypes: [ "div" ],
            license: "U",
            preloadedDependencies: [{
                machineName: "H5P.Dialectik",
                majorVersion: "0",
                minorVersion: "1"
            }]
          }
          const h5pJsonPath = join(tmpComponentPath, 'h5P.json')
          writeFileSync(h5pJsonPath, JSON.stringify(h5pjsonContent));

          // Create a zip archive
          const zipOutput = join(this.project.dir, this.project.title + '.h5p')
          const archive = archiver('zip', { zlib: { level: 9 } });
          const output = createWriteStream(zipOutput);

          const archivePromise = new Promise<void>((resolve, reject) => {
            output.on('close', () => {
              resolve();
            });

            archive.on('error', (err) => {
              reject(err);
            });
          });

          archive.pipe(output);
          archive.directory(tmpContentPath, 'content');
          archive.file(h5pJsonPath, { name: 'h5p.json' });
          archive.finalize();

          // Wait for the zip archive to complete
          await archivePromise;

          // Read the generated zip file
          const zipBuffer = readFileSync(zipOutput);

          // Add the zip file to the compilation assets
          compilation.emitAsset(lowerFirstLetter(this.project.title) + '.h5p', new BinarySource(zipBuffer));
        }
      );
      // Remove the generated JS file after emitting the zip file
      compilation.hooks.processAssets.tap(
      {
        name: `${pluginName}-remove-js`,
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
      },
      () => {
        if (generatedJSFile) {
          delete compilation.assets[generatedJSFile];
        }
      },
      );
    });
  }
}
