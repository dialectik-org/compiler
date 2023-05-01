import { loadPlugins } from "./plugins.mjs";
import { execute_task, start_server } from "./task.mjs";
import { CompilerOptions, Task } from "./types.mjs";
import { dirname } from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export { CompilerOptions, Task } from "./types.mjs";

export const compile = async (t : Task, wd : string) => {
  const coptions = new CompilerOptions(wd, __dirname);
  console.log(JSON.stringify(coptions, null, 2))
  const declared_plugins = await loadPlugins(coptions)
  await execute_task(t, declared_plugins, coptions)
}

export const start = async (t : Task, wd : string) => {
  const coptions = new CompilerOptions(wd, __dirname);
  console.log(JSON.stringify(coptions, null, 2))
  const declared_plugins = await loadPlugins(coptions)
  await start_server(t, declared_plugins, coptions)
}