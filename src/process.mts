import { find, getFullPath, getMdOptions, log, makeBundleId, options, replace, target } from './utils.mjs';
import { exec_webpack } from './webpack.mjs';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import rimraf from 'rimraf'
import { getMatter } from './matter.mjs';

export async function compile(o : options) {
  const tmpwd = join(o.currentwd, o.wd)
  const indexhtml = join(o.localdir, o.templatesdir, o.index)
  log(o, 'Dirname', o.localdir)
  log(o, 'Current directory:', o.currentwd)
  log(o, 'Temp working dir:', tmpwd)
  log(o, 'Index html', indexhtml)
  const mddir = join(o.currentwd, o.mddir)
  const files = find(mddir, o.extension)
  log(o, files)
  const options = await Promise.all(files.map(async file => {
    return getMdOptions(await getMatter(getFullPath(mddir, file, o)))
  }))
  log(o, options)
  const template_basic = join(o.localdir, o.templatesdir, o.basic)
  if (!existsSync(tmpwd)) {
    mkdirSync(tmpwd)
  }
  const targets : Array<target> = files.map((file, i) => {
    const bundleid = makeBundleId(file)
    const maintsx = join(tmpwd, bundleid + '_' + o.basic)
    const mdoptions = options[i]
    copyFileSync(template_basic, maintsx)
    replace(maintsx, o.mdsrcpath, getFullPath(mddir, file, o))
    return { bundleid, maintsx, mdoptions }
  })
  log(o, targets)
  // remove 'build' directory if exists
  const builddir = join(o.currentwd, 'build')
  if (existsSync(builddir)) {
    rimraf.sync(builddir)
  }
  targets.forEach(target => {
    exec_webpack(target, indexhtml, o.currentwd)
  })
}