import { CompilerOptions, ReactTemplateType, Task, TmpProject } from './types.mjs'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { basename } from 'path'

const get_react_template_type = (srcs : string[]) : ReactTemplateType => {
  if(srcs.length > 1) {
    return 'Multi'
  } else {
    return 'Single'
  }
}

/**
 * Creates a temporary React project to get compiled by webpack:
 * - 1 create project directory in temporary directory
 * - 2 copy resources (content, main, index, css)
 * @param task     compilation task
 * @param coptions compiler options
 * @returns        TmpProject data
 */
export const create_react_project = (task : Task, coptions : CompilerOptions) : TmpProject => {
  const tmp_project_dir          = join(coptions.tmpDir, task.id);
  const react_template           = coptions.getReactTemplate(get_react_template_type(task.sources))
  const react_template_path      = join(coptions.templateDir, react_template)
  const react_template_path_dest = join(tmp_project_dir, react_template)
  const default_react_comps_path = join(coptions.templateDir, coptions.reactComponents)
  const react_comps_path_dest    = join(tmp_project_dir, coptions.reactComponents)
  const index_html_path          = join(coptions.templateDir, coptions.htmlTemplate)
  const index_html_path_dest     = join(tmp_project_dir, coptions.htmlTemplate)
  if (!existsSync(tmp_project_dir)) {
    mkdirSync(tmp_project_dir)
    if (task.sources.length == 1) {
      const content              = task.sources[0]
      const content_path         = join(coptions.wDir, task.contentDirSuffix, content)
      const content_path_dest    = join(tmp_project_dir, 'content.md')
      copyFileSync(content_path, content_path_dest)
    } else {
      throw new Error(`Multi sources not supported (task '${task.id}')`)
    }
    copyFileSync(react_template_path, react_template_path_dest)
    copyFileSync(index_html_path, index_html_path_dest)
    if (task.components == 'Default') {
      copyFileSync(default_react_comps_path, react_comps_path_dest)
    } else {
      throw new Error(`Non default components '${coptions.reactComponents}' not supported yet (task '${task.id}')`)
    }
    var styles : string[] = []
    if (!task.externalStyle) {
      task.styles.forEach(style => {
        const style_path      = join(coptions.wDir, task.contentDirSuffix, style)
        const style_path_dest = join(tmp_project_dir, basename(style))
        styles.push(style_path_dest)
        copyFileSync(style_path, style_path_dest)
      })
    } else {
      styles = task.styles
    }
    return {
      dir         : tmp_project_dir,            // path to tmp project
      main        : react_template_path_dest,   // path to main.tsx
      index       : index_html_path_dest,       // path in index.html
      styles      : styles,                         // list of styles
      inlineCss   : task.inlineCss,
      inlineImage : task.inlineImage,
      inlineJs    : task.inlineJs,
    }
  } else {
    throw new Error(`Temporary directory already exists (${tmp_project_dir})`)
  }
}