import { readFileSync, writeFileSync } from "fs";
import { file } from "./find";

export interface target {
  main : string
  index : string
  file : file
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
