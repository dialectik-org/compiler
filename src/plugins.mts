import { join, extname } from 'path';
import { existsSync, readdirSync, Dirent, readFileSync } from 'fs';
import { refractor } from 'refractor'
import { CompilerOptions } from './types.mjs';

export const loadPlugins = (options: CompilerOptions) => {
  const prismPluginSrcDir = join(options.wDir, 'src/plugins/prism');
  if (existsSync(prismPluginSrcDir)) {
    loadPluginFiles(prismPluginSrcDir);
  }
  const packageJsonPath = join(options.wDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  if (packageJson.dialectik.plugins.prism !== undefined) {
    packageJson.dialectik.plugins.prism.forEach((pluginName : string) => {
    try {
      console.log(pluginName);
      const pluginPath = join(options.wDir, 'node_modules', pluginName);
      if (existsSync(pluginPath)) {
        loadPluginFiles(pluginPath)
      } else {
        console.warn(`Plugin "${pluginName}" not found in node_modules.`);
      }
    } catch (error) {
      console.error(`Failed to load plugin "${pluginName}":`, error);
    }
    });
  }
};

const loadPluginFiles = (pluginDirectory: string) => {
  readdirSync(pluginDirectory, { withFileTypes: true }).forEach(async (entry: Dirent) => {
    if (entry.isFile() && extname(entry.name) === '.mjs') {
      const grammar = join(pluginDirectory, entry.name);
      import(grammar).then((lang) => {
        refractor.register(lang.default);
      });
    }
  });
};