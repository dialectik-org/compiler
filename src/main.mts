#!/usr/bin/env node
//import { execute_task } from "./process.mjs";
//import { default_options } from "./utils.mjs";
//
//compile(default_options)

import { execute_task } from "./refactor/task.mjs";
import { CompilerOptions } from "./refactor/types.mjs";
import { dirname } from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const coptions = new CompilerOptions(process.cwd(), __dirname)

execute_task({
  id               : "Hello",
  contentDirSuffix : "",
  targetType       : 'HTML',
  sources          : ["src/md/hello.md"],
  styles           : [],
  components       : 'Default',
  prismStyle       : undefined,
  externalStyle    : false,
  static           : false,
  inlineCss        : false,
  inlineImage      : false,
  inlineJs         : false
 }, coptions)
