import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { dirname, extname, join, sep } from 'path'
import { fileURLToPath } from 'url';

/**
 * Compilation process options
 */
export interface options {
  currentwd    : string  // current working directory
  localdir     : string  // this package directory (to search for templates)
  mddir        : string  // relative directory path to search for Markdown files
  extension    : string  // extension to compile
  templatesdir : string  // templates directory
  basic        : string  // basic template file name
  index        : string  // html index file name in templates directory
  mdsrcpath    : string  // place holder to set path to md source path
  wd           : string  // temporary working directory
  verbose      : boolean // verbose log mode
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const default_options : options = {
  currentwd    : process.cwd(),
  localdir     : __dirname,
  mddir        : join('src', 'md'),
  extension    : 'md',
  templatesdir : 'templates',
  basic        : 'basic.tsx',
  index        : 'index.html',
  mdsrcpath    : '<MD_SOURCE_PATH>',
  wd           : join('src', 'tmp'),
  verbose      : false
}

export type mdoptions = {
  title   : string          // title tag value
  mode    : "dev" | "prod"  // compilation mode
  inline  : boolean         // single file compilation
  bundle ?: string          // bundle id
}

export function getMdOptions(matter : { [index:string] : string }) : mdoptions {
  return {
    title : matter.title ?? "Dialectik MD",
    mode : matter.mode != 'dev' && matter.mode != 'prod' ? 'prod' : matter.mode,
    inline : (matter.inline as unknown as boolean),
    bundle : matter.bundle
  }
}

export interface file {
  dir: string,
  name: string
}

export interface target {
  bundleid : string
  maintsx : string,
  mdoptions : mdoptions
}

function isExtension(name : string, ext : string) {
  return extname(name) == '.' + ext
}

function trimExtension(name : string) {
  return name.substring(0, name.lastIndexOf('.'));
}

function internal_find(root: string, dir : string, ext : string) : file[] {
  const full_dir = root + '/' + dir
  if (existsSync(full_dir)) {
    return readdirSync(full_dir, { withFileTypes : true }).reduce((acc, entry) => {
      if (entry.isFile() && isExtension(entry.name, ext)) {
        acc.push({
          dir: dir,
          name: trimExtension(entry.name)
        })
      } else if (entry.isDirectory()) {
        acc = acc.concat(internal_find(root, dir + sep + entry.name, ext))
      }
      return acc
    }, [] as file[])
  } else {
    console.log(`Directory '${dir}' not found.`)
    return []
  }
}

export function find(dir : string, ext: string) : file[] {
  return internal_find(dir, '', ext)
}

/**
 *
 * @param d MD direction
 * @param f file
 * @param o options
 * @returns full MD path
 */
export function getFullPath(d : string, f : file, o : options) : string {
  return d + (f.dir == '' ? '/' : (f.dir + '/')) + f.name + '.' + o.extension
}

/**
 * Replaces a string in a file
 * @param file path to file to replace
 * @param match string to be replaced
 * @param by replacing string
 */
export function replace(file : string, match : string, by : string) {
  const content = readFileSync(file, 'utf8')
  const ncontent = content.replace(match, by)
  writeFileSync(file, ncontent)
}

/**
 * Makes bundle identifier:
 * For example:
 * makeBundleId({ dir: '/project', name : 'file1' }) = project_file1
 * @param file returned by `find`
 * @param template ts index filename
 * @returns Bundle identifier
 */
export function makeBundleId(file : file) : string {
  let prefix = ''
  if (file.dir != '') {
    prefix = file.dir
    if (prefix.charAt(0) == sep) {
      prefix = prefix.slice(1)
    }
    prefix = prefix.replace(sep, '_') + '_'
  }
  return prefix + file.name
}

export function log(o : options, ...msgs : any[])  {
  if (o.verbose)
    console.log(msgs)
}
