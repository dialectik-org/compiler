import { MultiBar, SingleBar } from "cli-progress";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync } from "fs";
import { dirname, extname, join, sep } from 'path'
import { fileURLToPath } from 'url';
import { getMatter } from './matter.mjs'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter';
import {visit, EXIT} from 'unist-util-visit'
/**
 * Compilation process options
 */
export interface options {
  current      : string  // current working directory
  localdir     : string  // this package directory (to search for templates)
  mddir        : string  // relative directory path to search for Markdown files
  extension    : string  // extension to compile
  templatesdir : string  // templates directory
  basic        : string  // basic template file name
  index        : string  // html index file name in templates directory
  mdsrcpath    : string  // place holder to set path to md source path
  cssimport    : string  // place holder to insert ccs import statement
  csslink      : string  // plance holder to insert link declaration in index.html
  prismpath    : string  // path to prism theme directory relative to cwd
  katexurl     : string  // url to prism themes repo
  prismurl     : string  // url to prism themes repo
  wd           : string  // temporary working directory
  verbose      : boolean // verbose log mode
}

export interface file {
  dir   : string, // relative path to dir from 'currentDir'
  name  : string, // file name (without extension)
  mdate : Date    // last modification time
}

export class file {
  /**
   * file dependencies
   */
  public dependencies : file[]
  /**
   * Last modification date
   */
  public mdate : Date
  public name : string
  public extension : string
  /**
   * file constructor
   * @param root full path to root directory
   * @param dir relative path to dir from root
   * @param name file name (without extension)
   * @param extension file extension
   */
  constructor(
    public root      : string,
    public dir       : string,
    entry     : string) {
      const dotidx = entry.lastIndexOf('.')
      this.name = entry.substring(0, dotidx);
      this.extension = entry.substring(dotidx + 1, entry.length)
      const stats = statSync(this.getPath())
      this.mdate = stats.mtime
      this.dependencies = []
    }

    public getDir() : string {
      return this.root + (this.dir == '' ? '/' : (this.dir + '/'))
    }

    public getPath() : string {
      return this.getDir() + this.name + '.' + this.extension
    }

    public addDep(f : file) {
      this.dependencies.push(f)
    }

    public isMoreRecentThan(d : Date) : boolean {
      return this.mdate > d || this.dependencies.some(x => x.isMoreRecentThan(d))
    }
}

export class mdfile extends file {
  public options : mdoptions

  constructor(
    root      : string,
    dir       : string,
    name      : string) {
      super(root, dir, name)
      this.options = { title : '', mode : 'dev', inline : false, prismcss : '' }
  }

  public getBundleId() : string {
    if (this.options.bundle != undefined) {
      return this.options.bundle
    }
    let prefix = ''
    if (this.dir != '') {
      prefix = this.dir
      if (prefix.charAt(0) == sep) {
        prefix = prefix.slice(1)
      }
      prefix = prefix.replace(sep, '_') + '_'
    }
    return prefix + this.name
  }

  async processOptions() {
    const matter = await getMatter(this.getPath())
    this.options.title = matter.title ?? "Dialectik MD",
    this.options.mode = matter.mode != 'dev' && matter.mode != 'prod' ? 'prod' : matter.mode,
    this.options.inline = matter.inline != undefined ? (matter.inline as unknown as boolean) : true,
    this.options.prismcss = matter.prismcss ?? "prism-one-light.css"
    this.options.css = matter.css,
    this.options.bundle = matter.bundle
    if (this.options.css != undefined) {
      const css = new file(this.getDir(), '', this.options.css)
      this.addDep(css)
    }
  }
}

export type mdoptions = {
  title       : string          // title tag value
  mode        : "dev" | "prod"  // compilation mode
  inline      : boolean         // single file compilation
  css        ?: string          // relative path to css file
  index      ?: string          // relative path to index.html
  maintsx    ?: string          // relative path to maintsx
  prismcss    : string          // prism theme name
  bundle     ?: string          // bundle id
}

/**
 * Compilation target
 */
export class target {

  public title    : string
  public mode     : "dev" | "prod"
  public inline   : boolean
  public prismcss : string
  public bar     ?: SingleBar
  public srcs     : mdfile[]

  public getIndex() : string {
    let index = 'index.html'
    if (this.srcs.length > 0) {
      index = this.srcs[0].options.index ?? index
    }
    return join(this.tmpwd, index)
  }

  public getMain() : string {
    let main = 'basic.tsx'
    if (this.srcs.length > 0) {
      main = this.srcs[0].options.maintsx ?? main
    }
    return join(this.tmpwd, main)
  }

  public getTmpWd() : string { return this.tmpwd }

  constructor(
    public bundleid  : string, // bundle id
    public targetdir : string, // directory for compiled files
    public tmpwd     : string, // temporary working directory to copy index and main
    src : mdfile
  ) {
    this.title    = src.options.title
    this.mode     = src.options.mode
    this.inline   = src.options.inline
    this.prismcss = src.options.prismcss
    this.bar      = undefined
    this.srcs     = [src]
  }

  public setBar(mb : MultiBar, total : number) {
    this.bar = mb.create(total, 0, { filename : this.bundleid }, {
      format: '{bar} | {percentage}% | ' + this.bundleid,
      hideCursor: true
    })
  }

  public addSrc(mdf : mdfile) {
    const getmsg = (name : string) => `${name} setting from '${mdf.name}.md' is different from ${this.srcs.map(x => `'${x.name}.md'`).join(' ')}`
    if (this.title != mdf.options.title) {
      throw new Error(getmsg("'title'"))
    }
    if (this.mode != mdf.options.mode) {
      throw new Error(getmsg("'mode'"))
    }
    if (this.inline != mdf.options.inline) {
      throw new Error(getmsg("'inline'"))
    }
    this.srcs.push(mdf)
  }

  public isMoreRecentThan(d : Date) : boolean {
    return this.srcs.some(src => src.isMoreRecentThan(d))
  }

}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const default_options : options = {
  current    : process.cwd(),
  localdir     : __dirname,
  mddir        : join('src', 'md'),
  extension    : 'md',
  templatesdir : 'templates',
  basic        : 'basic.tsx',
  index        : 'index.html',
  mdsrcpath    : 'MD_SOURCE_PATH',
  cssimport    : '// IMPORT_CSS',
  csslink      : '<!-- LINKS -->',
  prismpath    : 'node_modules/prism-themes/themes',
  katexurl     : 'https://cdn.jsdelivr.net/npm/katex@0.16.3/dist/katex.min.css',
  prismurl     : 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes',
  wd           : join('src', 'tmp'),
  verbose      : false
}

function isExtension(name : string, ext : string) {
  return extname(name) == '.' + ext
}

async function internal_find(root: string, dir : string, ext : string) : Promise<mdfile[]> {
  const full_dir = join(root, dir)
  if (existsSync(full_dir)) {
    return await readdirSync(full_dir, { withFileTypes : true }).reduce(async (acc, entry) => {
      let a : mdfile[] = await acc
      if (entry.isFile() && isExtension(entry.name, ext)) {
        const file = new mdfile(root, dir, entry.name)
        await file.processOptions()
        a.push(file)
      } else if (entry.isDirectory()) {
        a = a.concat(await internal_find(root, dir + sep + entry.name, ext))
      }
      return a
    }, Promise.resolve([] as mdfile[]))
  } else {
    console.log(`Directory '${dir}' not found.`)
    return []
  }
}

export async function find(dir : string, ext: string) : Promise<mdfile[]> {
  return await internal_find(dir, '', ext)
}

/**
 * Replaces a string in a file
 * @param file path to file to replace
 * @param match string to be replaced
 * @param by replacing string
 */
export function replace(file : string, match : string | RegExp, by : string) {
  const content = readFileSync(file, 'utf8')
  const ncontent = content.replace(match, by)
  writeFileSync(file, ncontent)
}

export function log(verbose : boolean, ...msgs : any[])  {
  if (verbose)
    console.log(msgs)
}

export function logError(verbose : boolean, ...msgs : any[])  {
  if (verbose)
    console.error(...msgs)
}

export function getCssImportStt(css : string, o : options) : string {
  return `import '${css}'\n${o.cssimport}`
}

export function getCssLinkStt(csslink : string, o : options) : string {
  return `<link rel="stylesheet" href="${csslink}" crossorigin="anonymous">\n${o.csslink}`
}

/**
 *
 * @param {string} dir
 * @returns {Promise}
 */
export function ensureDirExists(dir : string) {
  try {
    return mkdirSync(dir, {recursive: true});
  } catch (err) {
    throw new Error(`Error: Failed to create directory for path ${dir}.\nMessage: ${err}`);
  }
}

/**
 * Set .html as default file extension if not exists
 * @param {string} route
 * @returns {string}
 */
export function getValidatedFileName(route : string) {
  const fileName = route === '/' ? '/index' : route;
  const withExtension = !!fileName.match(/(.htm$|.html$|.php$)/i);

  return withExtension ? fileName : `${fileName}.html`;
}

export interface requirements {
  katex : boolean,
  prism : boolean
}

export async function getRequired(file : mdfile) : Promise<requirements> {
  let katex = false
  let prism = false
  const content = readFileSync(file.getPath())
  const f = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .parse(content)
  visit(f, 'code', () => {
    prism = true
    return EXIT
  })
  visit(f, 'inlineMath', () => {
    katex = true
    return EXIT
  })
  return { katex , prism }
}

export function copyFiles(srcdir : string, targetdir : string, ext : string) {
  if (existsSync(targetdir)) {
    return readdirSync(srcdir, { withFileTypes : true }).forEach(entry => {
      if (entry.isFile() && isExtension(entry.name, ext)) {
        // copy file
        //console.log('copy', join(srcdir, entry.name), join(targetdir, entry.name) )
        copyFileSync(join(srcdir, entry.name), join(targetdir, entry.name))
      }
    })
  }
}

export function rmFiles(targetdir : string, ext : string) {

}