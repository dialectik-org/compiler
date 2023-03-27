import { join } from 'path'

export type ReactTemplateType = 'Single' | 'Multi'

export interface Task {
  id               : string,
  contentDirSuffix : string,
  targetType       : 'HTML' | 'H5P',
  sources          : string[],  // paths relative to contentDirSuffix
  styles           : string[],  // paths relative to contentDirSuffix
  components       : 'Default' | string
  externalStyle    : boolean,
  static           : boolean,
  inlineCss        : boolean,
  inlineImage      : boolean,
  inlineJs         : boolean
}

export interface TmpProject {
  dir         : string,   // path to tmp project
  main        : string,   // path to main.tsx relative to dir
  index       : string,   // path in index.html relative to dir
  styles      : string[], // list of styles
  inlineCss   : boolean,
  inlineImage : boolean,
  inlineJs    : boolean,
}

export class CompilerOptions {
  wDir            : string
  targetDir       : string
  tmpDir          : string
  templateDir     : string
  htmlTemplate    : string
  reactComponents : string
  reactTemplates  : Array<[ReactTemplateType, string]>
  constructor(wd  : string, compilerdir : string) {
    this.wDir            = wd
    this.targetDir       = join(wd, 'build')
    this.tmpDir          = join(wd, 'src', 'tmp')
    this.templateDir     = join(compilerdir, 'templates')
    this.htmlTemplate    = 'index.html'
    this.reactComponents = 'components.tsx'
    this.reactTemplates  = [
      ['Single', 'single.tsx'],
      ['Multi',  'multi.tsx' ]
    ]
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