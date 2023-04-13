import { join, extname } from 'path';
import { existsSync, readdirSync } from 'fs';
import { refractor } from 'refractor'
import { CompilerOptions } from './types.mjs';

export const loadPlugins = (options : CompilerOptions) => {
  const prismplugindir = join(options.wDir,'src/plugins/prism')
  if (existsSync(prismplugindir)) {
    readdirSync(prismplugindir, { withFileTypes : true }).forEach(async entry => {
      if (entry.isFile() && extname(entry.name) == '.mjs') {
        const grammar = join(prismplugindir, entry.name)
        import(grammar).then(lang => {
          refractor.register(lang.default)
        })
      }
    })
  }
}