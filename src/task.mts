import { create_react_project } from './react.mjs';
import { CompilerOptions, Task } from './types.mjs'
import { exec_webpack, start_webpack_dev } from './webpack.mjs';

export const execute_task = async (task : Task, coptions : CompilerOptions) => {
  console.log('Compile Task:', JSON.stringify(task, null,2))
  const project = create_react_project(task, coptions)
  console.log(project)
  await exec_webpack(task.id, project, coptions)
}

export const start_server = async (task : Task, coptions : CompilerOptions) => {
  console.log('Start Dev server for Task:', JSON.stringify(task, null,2))
  const project = create_react_project(task, coptions)
  console.log(project)
  await start_webpack_dev(task.id, project, coptions)
}
