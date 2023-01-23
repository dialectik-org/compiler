import { file, find, makeBundleId, options, replace, target } from './utils.mjs';
import { exec_webpack } from './webpack.mjs';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import rimraf from 'rimraf'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function compile(o : options) {
  const currentDir = process.cwd();
  console.log(currentDir);
  const mddir = join(currentDir, o.mddir)
  const files = find(mddir, o.extension)
  console.log(files)
  //console.log(tmpdir())
  console.log(__dirname)
  const template_basic = join(__dirname, o.templatesdir, o.basic)
  const tmpwd = join(currentDir, o.wd)
  console.log(tmpwd)
  if (!existsSync(tmpwd)) {
    mkdirSync(tmpwd)
  }
  const targets : Array<target> = files.map(file => {
    const bundleid = makeBundleId(file)
    const maintsx = join(tmpwd, bundleid + '_' + o.basic)
    copyFileSync(template_basic, maintsx)
    replace(maintsx, o.mdsrcpath, mddir + (file.dir == '' ? '/' : (file.dir + '/')) + file.name + '.md')
    return { bundleid, maintsx }
  })
  console.log(targets)
  const indexhtml = join(currentDir, 'src', 'index.html')
  console.log(indexhtml)
  // remove 'build' directory if exists
  const builddir = join(currentDir, 'build')
  if (existsSync(builddir)) {
    rimraf.sync(builddir)
  }
  targets.forEach(target => {
    exec_webpack(target, indexhtml, currentDir)
  })
}