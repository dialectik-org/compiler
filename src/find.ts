import { existsSync, readdirSync } from 'fs'
import { extname } from 'path'

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
        acc = acc.concat(internal_find(root, dir + '/' + entry.name, ext))
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
