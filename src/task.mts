import { create_react_project } from './react.mjs';
import { CompilerOptions, Task } from './types.mjs'
import { exec_webpack, start_webpack_dev } from './webpack.mjs';
import { getRequiredPlugins, INamedDialectikPlugin } from './plugins.mjs';

export const execute_task = async (task : Task, plugins : Array<INamedDialectikPlugin>, coptions : CompilerOptions) => {
  console.log('Compile Task:', JSON.stringify(task, null,2))
  const required_plugins = getRequiredPlugins(task, plugins, coptions)
  console.info('required plugins:', required_plugins.map(plugin => plugin.name))
  const project = create_react_project(task, required_plugins, coptions)
  console.log(project)
  await exec_webpack(task, project, coptions, required_plugins)
}

export const start_server = async (task : Task, plugins : Array<INamedDialectikPlugin>, coptions : CompilerOptions) => {
  console.log('Start Dev server for Task:', JSON.stringify(task, null,2))
  const required_plugins = getRequiredPlugins(task, plugins, coptions)
  if (required_plugins.length > 0) {
    console.info('required plugins:', required_plugins.map(plugin => plugin.name))
  }
  const project = create_react_project(task, required_plugins, coptions)
  console.log(project)
  await start_webpack_dev(task, project, coptions)
}
