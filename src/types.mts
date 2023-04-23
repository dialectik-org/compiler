import { join } from 'path'

export type ReactTemplateType = 'Single' | 'Multi'

export interface Task {
  id               : string | undefined,
  contentDirSuffix : string | undefined,
  targetType       : 'HTML' | 'H5P',
  targetDir        : string | undefined,
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
  inlineCss     : boolean,
  inlineImage   : boolean,
  inlineJs      : boolean,
  hasKatex      : boolean,
  hasPrism      : boolean,
  license       : boolean,
  copy          : Array<{ from : string, to : string  }>
}

export class CompilerOptions {
  wDir            : string
  tmpDir          : string
  templateDir     : string
  htmlTemplate    : string
  reactComponents : string
  katexCss        : string
  prismCss        : string
  reactTemplates  : Array<[ReactTemplateType, string]>
  constructor(wd  : string, compilerdir : string) {
    this.wDir            = wd
    this.tmpDir          = join(wd, 'src', 'tmp')
    this.templateDir     = join(compilerdir, 'templates')
    this.htmlTemplate    = 'index.html'
    this.reactComponents = 'components.tsx'
    this.katexCss        = 'https://cdn.jsdelivr.net/npm/katex@0.16.3/dist/katex.min.css'
    this.prismCss        = 'https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes'
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