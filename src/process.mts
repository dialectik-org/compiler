import { find, log, options, replace, target, getCssImportStt } from './utils.mjs'
import { exec_webpack } from './webpack.mjs'
import { copyFileSync, existsSync, statSync, mkdirSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'
import { Presets, MultiBar } from 'cli-progress';

export async function compile(o : options) {
  const tmpwd = join(o.currentwd, o.wd)
  const indexhtml = join(o.localdir, o.templatesdir, o.index)
  log(o, 'OPTIONS', o)
  log(o, 'Temp working dir:', tmpwd)
  log(o, 'Index html', indexhtml)
  const mddir = join(o.currentwd, o.mddir)
  const files = await find(mddir, o.extension)
  log(o, 'FILES', files)
  const alltargets = files.reduce((acc, file) => {
    const bundleid = file.getBundleId()
    if (acc[bundleid] != undefined) {
      acc[bundleid].addSrc(file)
    } else {
      acc[bundleid] = new target(
        bundleid,
        join(o.currentwd, 'build', bundleid),
        join(tmpwd, bundleid + '_' + o.basic),
        file)
    }
    return acc
  }, {} as { [index:string] : target })
  log(o, 'ALLTARGETS', alltargets)
  const mb = new MultiBar({
    hideCursor      : true,
    stopOnComplete  : true,
    clearOnComplete : false,
  }, Presets.shades_classic)
  const targets = Object.values(alltargets).reduce((acc, target) => {
    if (!existsSync(target.targetdir)) {
      target.setBar(mb, 2)
      acc.push(target)
    } else {
      const stats = statSync(target.targetdir)
      if (target.isMoreRecentThan(stats.ctime)) {
        target.setBar(mb, 2)
        acc.push(target)
      }
    }
    return acc
  }, [] as target[])
  log(o, 'TARGETS', targets)
  if (targets.length == 0) {
    console.warn('Nothing to compile.')
    mb.stop()
    return
  }
  const template_basic = join(o.localdir, o.templatesdir, o.basic)
  if (!existsSync(tmpwd)) {
    mkdirSync(tmpwd)
  }
  targets.forEach(target => {
    copyFileSync(template_basic, target.maintsx)
    if (target.srcs.length == 1) {
      replace(target.maintsx, o.mdsrcpath, target.srcs[0].getPath())
      const prismcss = join(o.currentwd, o.prismpath, target.srcs[0].options.prismcss)
      replace(target.maintsx, o.cssimport, getCssImportStt(prismcss))
      if (target.srcs[0].options.css != undefined) {
        const csspath = join(target.srcs[0].getDir(), target.srcs[0].options.css)
        replace(target.maintsx, o.cssimport, getCssImportStt(csspath))
      }
      target.bar?.increment(1)
    } else {
      throw new Error("Multi-md target no supported yet.")
    }
  })
  // remove 'build' directory if exists
  targets.forEach(target => {
    if (existsSync(target.targetdir)) {
      rimraf.sync(target.targetdir)
    }
  })
  // compile each target
  targets.forEach(target => {
    exec_webpack(target, indexhtml, o.currentwd, o)
  })
}