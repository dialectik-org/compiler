#!/usr/bin/env node
//import { execute_task } from "./process.mjs";
//import { default_options } from "./utils.mjs";
//
//compile(default_options)

import { loadPlugins } from "./plugins.mjs";
import { execute_task } from "./task.mjs";
import { CompilerOptions } from "./types.mjs";
import { dirname } from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const coptions = new CompilerOptions(process.cwd(), __dirname)

loadPlugins(coptions)

execute_task({
  id               : "Hello",
  contentDirSuffix : "",
  targetType       : 'HTML',
  sources          : ["src/md/hello.md"],
  styles           : ["src/md/style.css"],
  components       : 'Default',
  prismStyle       : undefined,
  externalStyle    : false,
  static           : false,
  inlineCss        : false,
  inlineImage      : false,
  inlineJs         : true
 }, coptions)
