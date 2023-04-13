import { create_react_project } from './react.mjs';
import { CompilerOptions, Task } from './types.mjs'
import { exec_webpack } from './webpack.mjs';

export const execute_task = async (task : Task, coptions : CompilerOptions) => {
  const project = create_react_project(task, coptions)
  console.log(project)
  await exec_webpack(project, coptions)
}
