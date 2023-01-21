import { find } from './find'
import { tmpdir } from 'os';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { replace, target } from './utils';

export interface options {
  mddir : string // directory to search for Markdown directories
}

export function compile(o : options) {
  const currentDir = process.cwd();
  console.log(currentDir);
  const mddir = currentDir + '/' + o.mddir
  const files = find(mddir, 'md')
  console.log(files)
  console.log(tmpdir())
  console.log(__dirname)
  const basic = __dirname + "/templates/basic.tsx"
  const tmpdialectik = tmpdir() + '/dialectik'
  if (!existsSync(tmpdialectik)) {
    mkdirSync(tmpdir() + '/dialectik')
  }
  const targets : target[] = files.map(file => {
    const main = tmpdialectik + '/' + (file.dir == '' ? '' : (file.dir.replace('/','_') + '_')) + file.name + '_basic.tsx'
    copyFileSync(basic, main)
    replace(main, '<MD_SOURCE_PATH>', mddir + (file.dir == '' ? '/' : (file.dir + '/')) + file.name + '.md')
    return {
      main : main,
      index : __dirname + '/templates/index.html',
      file : file
    }
  })
  console.log(targets)
}