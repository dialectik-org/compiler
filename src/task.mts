import { create_react_project } from './react.mjs';
import { CompilerOptions, Task } from './types.mjs'
import { exec_webpack } from './webpack.mjs';

export const execute_task = async (task : Task, coptions : CompilerOptions) => {
  console.log('Task to execute:', JSON.stringify(task, null,2))
  const project = create_react_project(task, coptions)
  console.log(project)
  await exec_webpack(task.id, project, coptions)
}
