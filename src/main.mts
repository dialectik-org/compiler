import { loadPlugins } from "./plugins.mjs";
import { execute_task } from "./task.mjs";
import { CompilerOptions, Task } from "./types.mjs";
import { dirname } from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export { CompilerOptions, Task } from "./types.mjs";

export const compile = (t : Task, wd : string) => {
  const coptions = new CompilerOptions(wd, __dirname);
  console.log(JSON.stringify(coptions, null, 2))
  loadPlugins(coptions)
  execute_task(t, coptions)
}