import { loadPlugins } from "./plugins.mjs";
import { dirname } from 'path'
import { fileURLToPath } from 'url';
import chalk from 'chalk'
import { create_react_project } from './react.mjs';
import { CompilerOptions, ReactProjectData, Task, Plugin } from './types.mjs'
import { exec_webpack, start_webpack_dev } from './webpack.mjs';
import { getRequiredPlugins } from './plugins.mjs';
import { augmentTask } from "./matter.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export { CompilerOptions, Task } from "./types.mjs";

function logStep(title : string, value ?: any) {
  if (value) {
    console.log(chalk.bold(title), value)
  } else {
    console.log(chalk.bold(title))
  }
}

const prepare = async (task : Task, wd : string) : Promise<{
  coptions : CompilerOptions,
  plugins : Plugin[],
  project : ReactProjectData,
}> => {
  const coptions = new CompilerOptions(wd, __dirname);
  logStep("Loading plugins ...")
  const plugins = await loadPlugins(coptions)
  logStep("Plugins:", plugins.map(plugin => plugin.name))
  coptions.setPlugins(plugins)
  //console.log(JSON.stringify(coptions, null, 2))
  logStep("Analysing source:", task.sources)
  const required_plugins = getRequiredPlugins(task, coptions.plugins, coptions)
  logStep('Required plugins:', required_plugins.map(plugin => plugin.name))
  logStep("Creating temporay project...")
  const matterTask = await augmentTask(task, coptions)
  const project = create_react_project(matterTask, required_plugins, coptions)
  //console.log(project)
  return {
    coptions: coptions,
    plugins: required_plugins,
    project: project
  }
}

export const compile = async (task : Task, wd : string) => {
  const { coptions,  plugins,  project } = await prepare(task, wd)
  logStep("Compiling project...")
  await exec_webpack(task, project, coptions, plugins)
}

export const start = async (task : Task, wd : string) => {
  const { coptions,  plugins,  project } = await prepare(task, wd)
  logStep("Stating dev server...")
  await start_webpack_dev(task, project, coptions, plugins)
}