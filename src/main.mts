import { loadPlugins } from "./plugins.mjs";
import { execute_task, start_server } from "./task.mjs";
import { CompilerOptions, Task } from "./types.mjs";
import { dirname } from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export { CompilerOptions, Task } from "./types.mjs";

export const compile = async (t : Task, wd : string, md ?: string) => {
  const coptions = new CompilerOptions(wd, __dirname, md);
  coptions.setPlugins(await loadPlugins(coptions))
  console.log(JSON.stringify(coptions, null, 2))
  await execute_task(t, coptions)
}

export const start = async (t : Task, wd : string, md ?: string) => {
  const coptions = new CompilerOptions(wd, __dirname, md);
  coptions.setPlugins(await loadPlugins(coptions))
  console.log(JSON.stringify(coptions, null, 2))
  await start_server(t, coptions)
}