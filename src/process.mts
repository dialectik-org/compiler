import { file, find, makeBundleId, options, replace } from './utils.mjs';
import { exec_webpack } from './webpack.mjs';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function compile(o : options) {
  const currentDir = process.cwd();
  console.log(currentDir);
  const mddir = join(currentDir, o.mddir)
  const files = find(mddir, o.extension)
  console.log(files)
  console.log(tmpdir())
  console.log(__dirname)
  const template_basic = join(__dirname, o.templatesdir, o.basic)
  const tmpwd = join(tmpdir(), o.wd)
  if (!existsSync(tmpwd)) {
    mkdirSync(tmpwd)
  }
  const targets : Array<[string, file]> = files.map(file => {
    const main = join(tmpwd, makeBundleId(file, o.basic))
    copyFileSync(template_basic, main)
    replace(main, o.mdsrcpath, mddir + (file.dir == '' ? '/' : (file.dir + '/')) + file.name + '.md')
    return [main, file]
  })
  console.log(targets)
  const index = __dirname + '/templates/index.html'
  console.log(index)
  exec_webpack(targets.map(p => { return p[0] }), index)
}