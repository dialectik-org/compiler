import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { extname, sep, basename } from 'path'

/**
 * Compilation process options
 */
export interface options {
  mddir        : string // relative directory path to search for Markdown files
  extension    : string // extension to compile
  templatesdir : string // templates directory
  basic        : string // basic template file name
  index        : string // html index file name in templates directory
  mdsrcpath    : string // place holder to set path to md source path
  wd           : string // temporary working directory
}

export const default_options : options = {
  mddir        : 'md',
  extension    : 'md',
  templatesdir : 'templates',
  basic        : 'basic.tsx',
  index        : 'index.html',
  mdsrcpath    : '<MD_SOURCE_PATH>',
  wd           : 'dialectiktmpwd',
}

export interface file {
  dir: string,
  name: string
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
    }, <file[]>[])
  } else {
    console.log(`Directory '${dir}' not found.`)
    return []
  }
}

export function find(dir : string, ext: string) : file[] {
  return internal_find(dir, '', ext)
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
 * Creates ts index file idnetifier:
 * For example:
 * makeBundleId({ dir: '/project', name : 'file1' }, 'basic.tsx') = project_file1_basic.tsx
 * @param file returned by `find`
 * @param template ts index filename
 * @returns ts index file idnetifier
 */
export function makeBundleId(file : file, template : string) : string {
  let prefix = ''
  if (file.dir != '') {
    prefix = file.dir
    if (prefix.charAt(0) == sep) {
      prefix = prefix.slice(1)
    }
    prefix = prefix.replace(sep, '_') + '_'
  }
  return prefix + file.name + '_' + template
}

/**
 * Creates the webpack `entries` object; for example:
 * getEntries([ '/tmp/dialiectik/file1.tsx', '/tmp/dialiectik/file1.tsx' ]) = {
 *   file1 : '/tmp/dialiectik/file1.tsx',
 *   file2 : '/tmp/dialiectik/file1.tsx'
 * }
 * @param targets list of ts index (full path)
 * @returns webpack `entries` object
 */
export function getEntries(targets : string[]) : { [index: string]: string } {
  const res : { [index: string]: string } = {}
  targets.forEach(target => {
    const filename = basename(target)
    const bundleid = filename.split('.')[0]
    res[ bundleid ] = target
  })
  return res
}