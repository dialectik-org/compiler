import { find, log, options, replace, target, getCssImportStt, getCssLinkStt, getRequired } from './utils.mjs'
import { exec_webpack } from './webpack.mjs'
import { copyFileSync, existsSync, statSync, mkdirSync, readdirSync } from 'fs'
import { join, extname } from 'path'
import rimraf from 'rimraf'
import { Presets, MultiBar } from 'cli-progress';
//import refactor from 'refractor'

//const module = await import('path');

export async function compile(o : options) {
  const tmpwd = join(o.current, o.wd)
  const indexhtml = join(o.localdir, o.templatesdir, o.index)
  log(o.verbose, 'OPTIONS', o)
  log(o.verbose, 'Temp working dir:', tmpwd)
  log(o.verbose, 'Index html', indexhtml)
  const mddir = join(o.current, o.mddir)
  const files = await find(mddir, o.extension)
  log(o.verbose, 'FILES', files)
  const alltargets = files.reduce((acc, file) => {
    const bundleid = file.getBundleId()
    if (acc[bundleid] != undefined) {
      acc[bundleid].addSrc(file)
    } else {
      acc[bundleid] = new target(
        bundleid,
        join(o.current, 'build', bundleid),
        join(tmpwd, bundleid),
        file)
    }
    return acc
  }, {} as { [index:string] : target })
  log(o.verbose, 'ALLTARGETS', alltargets)
  const mb = new MultiBar({
    hideCursor      : true,
    stopOnComplete  : true,
    clearOnComplete : false,
  }, Presets.shades_classic)
  const targets = Object.values(alltargets).reduce((acc, target) => {
    if (!existsSync(target.targetdir)) {
      target.setBar(mb, 3)
      acc.push(target)
    } else {
      const stats = statSync(target.targetdir)
      if (target.isMoreRecentThan(stats.ctime)) {
        target.setBar(mb, 3)
        acc.push(target)
      }
    }
    return acc
  }, [] as target[])
  log(o.verbose, 'TARGETS', targets)
  if (targets.length == 0) {
    console.warn('Nothing to compile.')
    mb.stop()
    return
  }
  // load plugins
  const prismplugindir = join(o.current,'src/plugins/prism')
  //if (existsSync(prismplugindir)) {
  //  await readdirSync(prismplugindir, { withFileTypes : true }).forEach(async entry => {
  //    if (entry.isFile() && extname(entry.name) == '.mjs') {
  //      //console.log(join(prismplugindir, entry.name))
  //      const grammar = join(prismplugindir, entry.name)
  //      import(grammar).then(lang => {
  //        refactor.register(lang.default)
  //      })
  //    }
  //  })
  //}
  const template_basic_tsx = join(o.localdir, o.templatesdir, o.basic)
  const template_index_html = join(o.localdir, o.templatesdir, o.index)
  if (!existsSync(tmpwd)) {
    mkdirSync(tmpwd)
  }
  targets.forEach(async target => {
    if (!existsSync(join(tmpwd,target.bundleid))) {
      mkdirSync(join(tmpwd,target.bundleid))
    }
    // copy main
    copyFileSync(template_basic_tsx, target.getMain())
    // copy index
    copyFileSync(template_index_html, target.getIndex())
    if (target.srcs.length == 1) {
      // import md source in main.tsx
      const source = target.srcs[0]
      replace(target.getMain(), o.mdsrcpath, source.getPath())
      const requirements = await getRequired(source)
      if (requirements.katex) {
        // import katex css in index.html
        const katexcss = join(o.katexurl)
        replace(target.getIndex(), o.csslink, getCssLinkStt(katexcss, o))
      }
      if (requirements.prism) {
        // import prism css in index.html
        const prismcss = join(o.prismurl, source.options.prismcss)
        replace(target.getIndex(), o.csslink, getCssLinkStt(prismcss, o))
      }
      // import css in main.tsx
      if (source.options.css != undefined) {
        const csspath = join(source.getDir(), source.options.css)
        replace(target.getMain(), o.cssimport, getCssImportStt(csspath, o))
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
  targets.forEach(async (target, i) => {
    await exec_webpack(target, o.current, o, i)
  })
}