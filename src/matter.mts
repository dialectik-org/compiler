import {read} from 'to-vfile'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkStringify from 'remark-stringify'
import {matter} from 'vfile-matter'
import { VFile } from 'vfile'

export async function getMatter(filepath : string) : Promise<{ [index:string] : string }> {
  const res = await unified()
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkFrontmatter)
    .use(() => {
      return function (_ : string, file : VFile) {
        matter(file)
      }
    })
    .process(await read(filepath))
  return res.data.matter as { [index:string] : string }
}

