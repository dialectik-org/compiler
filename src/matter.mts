import {read} from 'to-vfile'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkStringify from 'remark-stringify'
import {matter} from 'vfile-matter'
import { VFile } from 'vfile'
import { CompilerOptions, Task } from './types.mjs'
import { dirname, join } from 'path'

async function getMatter(filepath : string) : Promise<{ [index:string] : string }> {
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

function getStylePath(sourcePath : string, stylePath : string) {
  return join(dirname(sourcePath), stylePath)
}

export async function augmentTask(task : Task, coptions : CompilerOptions) : Promise<Task> {
  const content              = task.sources[0]
  const content_dir          = join(coptions.wDir, task.contentDirSuffix ?? '')
  const content_path         = join(content_dir, content)
  const data = await getMatter(content_path)
  return { ...task,
    title : data.title ?? task.title,
    styles : data.style ? [getStylePath(task.sources[0], data.style)] : task.styles
  }
}

