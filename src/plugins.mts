import { join } from 'path';
import { readFileSync } from 'fs';
import { CompilerOptions, Task } from './types.mjs';
import { IDialectikPlugin, IPluginProvider } from '@dialectik/plugin-interface'

export type INamedDialectikPlugin = IDialectikPlugin & { name : string }

export const loadPlugins = async (options: CompilerOptions) : Promise<Array<INamedDialectikPlugin>> => {
  const packageJsonPath = join(options.wDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  if (packageJson?.dialectik?.plugins?.length !== undefined) {
    const pluginPromises = packageJson.dialectik.plugins.map(async (pluginData : string | { name : string, arg : any }) => {
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
      const pluginModule = await import(pluginName);
      const pluginInstance: IDialectikPlugin = (pluginModule.PluginProvider as IPluginProvider).getPlugin(pluginArg);
      return { ...pluginInstance, name: pluginName };
    });
    const plugins = await Promise.all(pluginPromises);
    return plugins;
  }
  console.warn("No plugin declaration found in package.json")
  return []
};

export const getRequiredPlugins = (task : Task, plugins : Array<INamedDialectikPlugin>, coptions : CompilerOptions) : Array<INamedDialectikPlugin> => {
  if (task.sources.length == 1) {
    const content              = task.sources[0]
    const content_dir          = join(coptions.wDir, task.contentDirSuffix ?? '')
    const content_path         = join(content_dir, content)
    const fileContent = readFileSync(content_path, 'utf-8');
    return plugins.reduce((acc, plugin) => {
      if (plugin.isRequired(fileContent)) {
        return acc.concat([plugin])
      } else {
        return acc
      }
    }, [] as Array<INamedDialectikPlugin>)
  } else {
    throw new Error(`Multi sources not supported (task '${task.id}')`)
  }
}
