import { join, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { CompilerOptions, Plugin, Task } from './types.mjs';
import { IDialectikPlugin, IPluginProvider } from '@dialectik/plugin-interface'

interface moduleData {
  url : URL,
  dir : string,
}

function resolveModulePath(moduleName : string, directories : string[]) : moduleData {
  for (const directory of directories) {
    const moduleFolder = join(directory, moduleName);
    try {
      const packageJsonPath = join(moduleFolder, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const mainFile = packageJson.main || 'index.js';
        const modulePath = join(moduleFolder, mainFile);
        if (existsSync(modulePath)) {
          return {
            url : pathToFileURL(modulePath),
            dir : moduleFolder,
          }
        }
      }
    } catch (error) {
      // Ignore the error and continue with the next directory
    }
  }
  throw new Error(`Cannot find module '${moduleName}' in any of the specified directories.`);
}

function pathToFileURL(filePath : string) {
  return new URL(`file://${resolve(filePath)}`);
}

export const loadPlugins = async (options: CompilerOptions) : Promise<Array<Plugin>> => {
  const packageJsonPath = join(options.wDir, 'dialectik.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  if (packageJson?.plugins?.length !== undefined) {
    const pluginPromises : Array<Promise<Plugin>> = packageJson.plugins.map(async (pluginData : string | { name : string, arg : any }) : Promise<Plugin> => {
      let pluginName = ""
      let pluginArg = undefined
      if (typeof pluginData === "string") {
        pluginName = pluginData
      } else if (pluginData.name !== undefined) {
        pluginName = pluginData.name
        pluginArg = pluginData.arg
      } else {
        throw new Error(`Invalid plugin data: ${JSON.stringify(pluginData, null, 2)}`)
      }
      const directories = [
        options.modulesDir,
        join(options.wDir, 'node_modules'),
      ];

      const myModuleData = resolveModulePath(pluginName, directories);
      const pluginModule = await import(myModuleData.url.href);
      const pluginInstance: IDialectikPlugin = (pluginModule.PluginProvider as IPluginProvider).getPlugin(pluginArg);
      return {
        name : pluginName,
        data : pluginInstance,
        dir  : myModuleData.dir,
      }
    });
    const plugins = await Promise.all(pluginPromises);
    return plugins;
  }
  console.warn("No plugin declaration found in package.json")
  return []
};

export const getRequiredPlugins = (task : Task, plugins : Array<Plugin>, coptions : CompilerOptions) : Array<Plugin> => {
  if (task.sources.length == 1) {
    const content              = task.sources[0]
    const content_dir          = join(coptions.wDir, task.contentDirSuffix ?? '')
    const content_path         = join(content_dir, content)
    const fileContent = readFileSync(content_path, 'utf-8');
    return plugins.reduce((acc, plugin) => {
      if (plugin.data.isRequired(fileContent)) {
        return acc.concat([plugin])
      } else {
        return acc
      }
    }, [] as Array<Plugin>)
  } else {
    throw new Error(`Multi sources not supported (task '${task.id}')`)
  }
}
