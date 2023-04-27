import { ReactProjectData } from '../types.mjs';
import CleanCSS from 'clean-css';
import { readFileSync } from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { Compilation, Compiler, WebpackPluginInstance } from 'webpack';

/**
 * InjectExternalCssPlugin is a Webpack plugin that inserts the minified content
 * of an external CSS file into the HTML as an inline style tag. This can help
 * improve the loading performance of a React project by reducing the number of
 * external requests and providing faster access to critical CSS content.
 *
 * The plugin is designed to work with HtmlWebpackPlugin, and it hooks into the
 * `beforeEmit` event to modify the HTML before it's emitted. The external CSS
 * file is read and minified using CleanCSS before being injected into the HTML
 * just before the closing </body> tag.
 *
 * Example usage:
 *
 * const projectData = { styles: ['./path/to/external.css'] };
 * const injectExternalCssPlugin = new InjectExternalCssPlugin(projectData);
 *
 * // In Webpack configuration:
 * plugins: [
 *   ...otherPlugins,
 *   injectExternalCssPlugin,
 * ]
 */
export class InjectExternalCssPlugin implements WebpackPluginInstance {
  private project: ReactProjectData;

  constructor(project: ReactProjectData) {
    this.project = project;
  }

  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap('InjectExternalCss', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        'InjectExternalCss',
        (data, cb) => {
          const cssFilePath = this.project.styles[0];
          const cssContent = readFileSync(cssFilePath, 'utf-8');
          const cleanCSS = new CleanCSS();
          const minifiedCSS = cleanCSS.minify(cssContent);
          const styleTag = `<style>${minifiedCSS.styles}</style>`;
          data.html = data.html.replace('</body>', `${styleTag}</body>`);
          cb(null, data);
        }
      );
    });
  }
}
