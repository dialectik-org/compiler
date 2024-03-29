import { IDialectikPlugin } from '@dialectik/plugin-interface'
import { join } from 'path'
import { readFileSync } from 'fs'

export type ReactTemplateType = 'Single' | 'Multi'

export interface Task {
  id               : string | undefined,
  title            : string | undefined,
  contentDirSuffix : string | undefined,
  targetType       : 'HTML' | 'H5P',
  targetDir        : string | undefined,
  sources          : string[],  // paths relative to contentDirSuffix
  styles           : string[],  // paths relative to contentDirSuffix
  components       : string | undefined,
  prismStyle       : string | undefined,
  externalStyle    : boolean,
  inlineCss        : boolean,
  inlineImage      : boolean,
  inlineJs         : boolean,
  license          : boolean
}

export interface ReactProjectData {
  id            : string,
  title         : string,
  dir           : string,   // path to tmp project
  targetDir     : string    // directory for generation
  targetName    : string    // file name to generate
  main          : string,   // path to main.tsx relative to dir
  index         : string,   // path in index.html relative to dir
  styles        : string[], // list of styles
  externalStyle : boolean,
  prismStyle    : string,
  hasPrism      : boolean,
  watch          : Array<{ from : string, to : string  }>
}

export interface Plugin {
  name : string,
  data : IDialectikPlugin,
  dir  : string,
}

export interface Settings {
  compilerOptions ?: {
    moduleDir ?: string
    tmpDir    ?: string
  },
  plugins ?: Array< string | { name : string, arg : any } >
}

function loadSettings(wd : string) : Settings {
  const settingsJsonPath = join(wd, 'dialectik.json');
  const settingsJson = JSON.parse(readFileSync(settingsJsonPath, 'utf-8'));
  return settingsJson
}

export class CompilerOptions {
  wDir            : string
  settings        : Settings
  templateDir     : string
  modulesDir      : string
  htmlTemplate    : string
  reactComponents : string
  modules         : {
    babelLoader   : string,
    tsLoader      : string,
    styleLoader   : string,
    cssLoader     : string,
    mdxLoader     : string,
    fileLoader    : string,
    types         : string
  }
  plugins         : Plugin[]
  reactTemplates  : Array<[ReactTemplateType, string]>
  constructor(wd  : string, compilerdir : string) {
    this.wDir            = wd
    this.settings        = loadSettings(wd)
    this.templateDir     = join(compilerdir, 'templates')
    // compiler dir is .../node_modules/@dialectik/compiler/build
    this.modulesDir      = this.settings.compilerOptions?.moduleDir ?? join(compilerdir, '..', '..', '..')
    this.htmlTemplate    = 'index.html'
    this.reactComponents = 'components.tsx'
    this.reactTemplates  = [
      ['Single', 'single.tsx'],
      ['Multi',  'multi.tsx' ]
    ]
    this.modules         = {
      babelLoader        : join(this.modulesDir, "babel-loader"),
      tsLoader           : join(this.modulesDir, "ts-loader"),
      styleLoader        : join(this.modulesDir, "style-loader"),
      cssLoader          : join(this.modulesDir, "css-loader"),
      mdxLoader          : join(this.modulesDir, "@mdx-js/loader"),
      fileLoader         : join(this.modulesDir, "file-loader"),
      types              : join(this.modulesDir, '@types')
    }
    this.plugins         = []
  }
  getReactTemplate(rtyp : ReactTemplateType) : string {
    for(var i=0; i<this.reactTemplates.length; i++) {
      if (this.reactTemplates[i][0] == rtyp) {
        return this.reactTemplates[i][1]
      }
    }
    throw new Error(`getReactTemplate: unknown type ${rtyp}`)
  }
  setPlugins(plugins : Plugin[]) {
    this.plugins = plugins
  }
}