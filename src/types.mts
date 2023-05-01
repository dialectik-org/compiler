import { dirname, join } from 'path'

export type ReactTemplateType = 'Single' | 'Multi'

export interface Task {
  id               : string | undefined,
  contentDirSuffix : string | undefined,
  targetType       : 'HTML' | 'H5P',
  targetDir        : string | undefined,
  tmpDir           : string | undefined,
  sources          : string[],  // paths relative to contentDirSuffix
  styles           : string[],  // paths relative to contentDirSuffix
  components       : string | undefined,
  prismStyle       : string | undefined,
  externalStyle    : boolean,
  static           : boolean,
  inlineCss        : boolean,
  inlineImage      : boolean,
  inlineJs         : boolean,
  license          : boolean
}

export interface ReactProjectData {
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

export class CompilerOptions {
  wDir            : string
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
  reactTemplates  : Array<[ReactTemplateType, string]>
  constructor(wd  : string, compilerdir : string) {
    this.wDir            = wd
    this.templateDir     = join(compilerdir, 'templates')
    this.modulesDir      = compilerdir
    this.htmlTemplate    = 'index.html'
    this.reactComponents = 'components.tsx'
    this.reactTemplates  = [
      ['Single', 'single.tsx'],
      ['Multi',  'multi.tsx' ]
    ]
    this.modules         = {
      babelLoader        : join(wd, "node_modules", "babel-loader"),
      tsLoader           : join(wd, "node_modules", "ts-loader"),
      styleLoader        : join(wd, "node_modules", "style-loader"),
      cssLoader          : join(wd, "node_modules", "css-loader"),
      mdxLoader          : join(wd, "node_modules", "@mdx-js/loader"),
      fileLoader         : join(wd, "node_modules", "file-loader"),
      types              : join(wd, 'node_modules', '@types')
    }
  }
  getReactTemplate(rtyp : ReactTemplateType) : string {
    for(var i=0; i<this.reactTemplates.length; i++) {
      if (this.reactTemplates[i][0] == rtyp) {
        return this.reactTemplates[i][1]
      }
    }
    throw new Error(`getReactTemplate: unknown type ${rtyp}`)
  }
}