import { capitalize, copyDirectorySync, getFilenameWithoutExtension, isOnlineUrl, lowerFirstLetter, mkOrCleanDir } from './fsutils.mjs'
import { CompilerOptions, Plugin, ReactProjectData, ReactTemplateType, Task } from './types.mjs'
import { copyFileSync, mkdirSync } from 'fs'
import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { basename, dirname, join } from 'path'
import { remark } from 'remark';
import parse from 'remark-parse';
import { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';

interface ImageNode extends Node {
  type: 'image';
  url: string;
}

function isImageNode(node: Node): node is ImageNode {
  return node.type === 'image' && typeof (node as ImageNode).url === 'string';
}

function extractLocalResourcesSync(filePath: string): string[] {
  const fileContent = readFileSync(filePath, 'utf-8');

  const tree = remark().use(parse).parse(fileContent) as Parent;

  const localResources: string[] = [];

  visit(tree, isImageNode, (node: ImageNode) => {
    if(!isOnlineUrl(node.url)) {
      localResources.push(node.url);
    }
  });

  // Extract import sources
  const importRegex = /^import([ \t]*(?:[^ \t\{\}]+[ \t]*,?)?(?:[ \t]*\{(?:[ \t]*[^ \t"'\{\}]+[ \t]*,?)+\})?[ \t]*)from[ \t]*(['"])([^'"]+)(?:['"])/gm;

  let match;
  while ((match = importRegex.exec(fileContent)) !== null) {
    const importSource = match[3];
    if (!isOnlineUrl(importSource)) {
      localResources.push(importSource);
    }
  }
  return localResources;
}

const isBundled = (task : Task) => {
  return task.inlineCss && task.inlineJs && task.inlineImage && !task.externalStyle
}

const getTargetDir = (base : string, id : string, task : Task) => {
  return isBundled(task) ? base : join(base, id)
}

const getDefaultTargetDir = (task : Task, id : string, coptions : CompilerOptions) => {
  const base = join(coptions.wDir, task.contentDirSuffix ?? '', dirname(task.sources[0]))
  //console.log(`base, id: ${base}, ${id}`)
  //console.log(`is bundled: ${isBundled(task)}`)
  return getTargetDir(base, id, task)
}

const getId = (task : Task) => {
  return task.id ?? capitalize(getFilenameWithoutExtension(task.sources[0]))
}

function formatString(input: string): string {
  // Split the input string on '/' and '-'
  const parts = input.split(/[/\-]/);

  // Remove special characters, capitalize each item, and join them together
  const formatted = parts
    .map((part) => part.replace(/[^a-zA-Z0-9]+/g, ''))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return formatted;
}

function getComponentName(plugin : Plugin) {
  return capitalize(formatString(plugin.name)) + 'GetComponents'
}

const generateImports = (plugins: Array<Plugin>) : string => {
  const imports : string[] = plugins.reduce((acc, plugin) => {
    if (plugin.data.withComponents) {
      const componentName = getComponentName(plugin)
      return acc.concat([
        "import { getComponents as " +  componentName + " } from './" + basename(plugin.name) + "/components'"
      ])
    } else {
      return acc
    }
  }, [] as string[])
  return imports.join('\n')
}

const generateComponents = (plugins: Array<Plugin>) : string => {
  const components : string[] = plugins.reduce((acc, plugin) => {
    if (plugin.data.withComponents) {
      const componentName = getComponentName(plugin)
      return acc.concat(['...' + componentName + '()'])
    } else {
      return acc
    }
  }, [] as string[])
  return '{ ' + components.join(', \n\t') + ' }'
}

const generateMain = (inputFilePath: string, outputFilePath: string, plugins: Array<Plugin>) => {
  // Read the template file
  const template = readFileSync(inputFilePath, 'utf-8');

  // Define the values to replace the placeholders
  const values : { [key:string]: string } = {
    imports: generateImports(plugins),
    getcomponents: generateComponents(plugins),
  };
  //console.log(JSON.stringify(values, null, 2))

  // Replace the placeholders with the actual values
  const generatedCode = template.replace(/\[\[(\w+)\]\]/gi, (match, variableName : string) => {
    return values[variableName] || '';
  });

  // Write the generated code to a new file
  try {
    writeFileSync(outputFilePath, generatedCode, 'utf8');
    console.log(`Generated code was successfully written to temporay directory`);
  } catch (error) {
    console.error(`Error writing generated code to ${outputFilePath}:`, error);
  }
}

const copyPluginsComponent = (tmp_project_dir : string, plugins : Array<Plugin>, coptions : CompilerOptions) => {
  plugins.forEach(plugin => {
    if (plugin.data.withComponents !== undefined) {
      const sourceDir = join(plugin.dir, 'lib', 'react')
      const targetDir = join(tmp_project_dir, basename(plugin.name))
      //console.log(`copy ${sourceDir} to ${targetDir}`)
      copyDirectorySync(sourceDir, targetDir)
    }
  })
}

function getReactMain(plugins : Array<Plugin>) : string {
  const main : string = plugins.reduce((acc, plugin) => {
    if (plugin.data.withMain) {
      return join(plugin.dir, 'lib', 'react', 'main.tsx')
    } else {
      return acc
    }
  }, "")
  if (main !== "") {
    return main
  } else throw new Error("No React main provided by any plugin")
}

/**
 * Creates a temporary React project to get compiled by webpack:
 * - 1 create project directory in temporary directory
 * - 2 copy resources (content, main, index, css)
 * @param task     compilation task
 * @param coptions compiler options
 * @returns        TmpProject data
 */
export const create_react_project = (task : Task, plugins: Array<Plugin>, coptions : CompilerOptions) : ReactProjectData => {
  const task_id                  = getId(task)
  const tmp_project_dir          = coptions.settings?.compilerOptions?.tmpDir ? join(coptions.wDir, coptions.settings?.compilerOptions?.tmpDir, task_id) : join(tmpdir(), task_id);
  const react_main               = getReactMain(plugins)
  const react_template_path_dest = join(tmp_project_dir, 'main.tsx')
  const default_react_comps_path = join(coptions.templateDir, coptions.reactComponents)
  const react_comps_path_dest    = join(tmp_project_dir, coptions.reactComponents)
  const index_html_path          = join(coptions.templateDir, coptions.htmlTemplate)
  const index_html_path_dest     = join(tmp_project_dir, coptions.htmlTemplate)
  const target_dir               = task.targetDir ? getTargetDir(join(coptions.wDir, task.targetDir), task_id, task) : getDefaultTargetDir(task, task_id, coptions)
  mkOrCleanDir(tmp_project_dir)
  const watch                    = []
  if (task.sources.length == 1) {
    const content              = task.sources[0]
    const content_dir          = join(coptions.wDir, task.contentDirSuffix ?? '')
    const content_path         = join(content_dir, content)
    const content_path_dest    = join(tmp_project_dir, 'content.md')
    watch.push({ from : content_path, to : content_path_dest })
    copyFileSync(content_path, content_path_dest)
    const localResources = extractLocalResourcesSync(content_path)
    localResources.forEach(url => {
      const target_resource_dir = join(tmp_project_dir, dirname(url))
      mkdirSync(target_resource_dir, { recursive: true })
      const source_resource_path = join(dirname(content_path), url)
      const target_resource_path = join(tmp_project_dir, url)
      copyFileSync(source_resource_path, target_resource_path)
      watch.push({ from : source_resource_path, to : target_resource_path })
    })
  } else {
    throw new Error(`Multi sources not supported (task '${task_id}')`)
  }
  copyPluginsComponent(tmp_project_dir, plugins, coptions)
  generateMain(react_main, react_template_path_dest, plugins)
  copyFileSync(index_html_path, index_html_path_dest)
  if (task.components == 'Default') {
    copyFileSync(default_react_comps_path, react_comps_path_dest)
    // copy components css
    copyDirectorySync(join(coptions.templateDir, 'css'), join(tmp_project_dir, 'css'))
  } else {
    throw new Error(`Non default components '${coptions.reactComponents}' not supported yet (task '${task_id}')`)
  }
  var styles : string[] = []
  if (!task.externalStyle) {
    task.styles.forEach(style => {
      const style_path      = join(coptions.wDir, task.contentDirSuffix ?? '', style)
      const style_path_dest = join(tmp_project_dir, basename(style))
      watch.push({ from : style_path, to : style_path_dest })
      styles.push(style_path_dest)
      copyFileSync(style_path, style_path_dest)
    })
  } else {
    styles = task.styles
  }
  // copy tsconfig
  copyFileSync(join(coptions.templateDir, 'tsconfig.json'), join(tmp_project_dir, 'tsconfig.json'))
  copyFileSync(join(coptions.templateDir, 'react-app-env.d.ts'), join(tmp_project_dir, 'react-app-env.d.ts'))
  return {
    id            : task_id,
    title         : task.title ?? task_id,
    dir           : tmp_project_dir,            // path to tmp project
    targetDir     : target_dir,
    targetName    : isBundled(task) ? lowerFirstLetter(task_id) + '.html' : 'index.html',
    main          : react_template_path_dest,   // path to main.tsx
    index         : index_html_path_dest,       // path in index.html
    styles        : styles,                     // list of styles
    externalStyle : task.externalStyle,
    prismStyle    : task.prismStyle ?? 'prism-one-light.css',
    hasPrism      : true,
    watch          : watch,
  }
}