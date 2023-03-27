import { create_react_project } from './react.mjs';
import { CompilerOptions, Task } from './types.mjs'

export const execute_task = (task : Task, coptions : CompilerOptions) => {
  const project = create_react_project(task, coptions)
  console.log(project)
}