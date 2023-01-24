import { find, getFullPath, getMdOptions, log, makeBundleId, options, replace, target, isOlderThan } from './utils.mjs';
import { exec_webpack } from './webpack.mjs';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import rimraf from 'rimraf'
import { getMatter } from './matter.mjs';
import { Presets, MultiBar } from 'cli-progress';

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
  const mb = new MultiBar({
    hideCursor: true,
    stopOnComplete: true,
    clearOnComplete: false,
  }, Presets.shades_classic)
  const targets = await files.reduce(async (acc, file, i) => {
    const a = await acc
    const bundleid = makeBundleId(file)
    const resdir   = join(o.currentwd, 'build', bundleid)
    const maintsx = join(tmpwd, bundleid + '_' + o.basic)
    const filename = file.dir + (file.dir == '' ? '' : '/') + file.name
    if (isOlderThan(resdir, file.mdate)) {
      const bar = mb.create(3, 0, {file: filename}, {
        format: '{bar} | {percentage}% | ' + filename,
        hideCursor: true
      })
      const mdoptions = getMdOptions(await getMatter(getFullPath(mddir, file, o)))
      bar.increment(1)
      const src = file
      a.push({ bundleid, resdir, maintsx, mdoptions, src, bar })
    }
    return a
  }, Promise.resolve([] as target[]))
  log(o, targets)
  if (targets.length == 0) {
    console.log('Nothing to compile.')
    mb.stop()
    return
  }
  const template_basic = join(o.localdir, o.templatesdir, o.basic)
  if (!existsSync(tmpwd)) {
    mkdirSync(tmpwd)
  }
  targets.forEach(target => {
    copyFileSync(template_basic, target.maintsx)
    replace(target.maintsx, o.mdsrcpath, getFullPath(mddir, target.src, o))
    target.bar.increment(1)
  })
  // remove 'build' directory if exists
  targets.forEach(target => {
    if (existsSync(target.resdir)) {
      rimraf.sync(target.resdir)
    }
  })
  // compile each target
  targets.forEach(target => {
    exec_webpack(target, indexhtml, o.currentwd, o)
  })
}