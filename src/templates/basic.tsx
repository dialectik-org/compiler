// @ts-ignore
import React from 'react';
// @ts-ignore
import ReactDOM from 'react-dom/client';
// @ts-ignore
import Highlight from "prism-react-renderer";
import { defaultProps, Language } from "prism-react-renderer"
import Prism from 'prism-react-renderer/prism/index'

// @ts-ignore
import Content from 'MD_SOURCE_PATH'; // to be replaced
// IMPORT_CSS

// @ts-ignore
//(typeof global !== "undefined" ? global : window).Prism = Prism;

// @ts-ignore
import {archetype} from "../../plugins/prism/archetype"
Prism.languages.archetype = archetype

const RenderPrism = ({ code, lang, meta } : { code : any, lang : Language, meta : string }) => {
  const withLines = meta.toString().includes('showLineNumbers')
  return (
  // @ts-ignore
  <Highlight Prism={Prism} {...defaultProps} theme={undefined} code={code} language={lang}>
    {({ className, style, tokens, getLineProps, getTokenProps } : { className : any, style : any, tokens : any, getLineProps : any, getTokenProps : any }) => (
      <pre className={className} style={{...style,
        textAlign: 'left',
        margin: '1em 0',
        padding: '0.5em',
        overflow: 'scroll'
      }}>
        {tokens.map((line : any, i : number) => (
          <div style={{display: 'table-row'}} {...getLineProps({ line, key: i })}>
            { withLines ?
              <span style={{
                display: 'table-cell',
                textAlign: 'right',
                paddingRight: '1em',
                userSelect: 'none',
                opacity: '0.5'
              }}>{i+1}</span>
            : <></>
            }
            <div style={{ display: 'table-cell' }}>
              {line.map((token : any, key : any) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          </div>
        ))}
      </pre>
    )}
  </Highlight>
)}

const Link = ({ children, href } : { children : any, href : any }) => {
  // Check if the link is for a section on the page
  // We don't want to add the attributes for the on page links
  const onPage = href.startsWith('#');
  return (
    <a
      href={href}
      // Open the link in a new page
      target={onPage ? undefined : '_blank'}
      // Add noopener and noreferrer for security reasons
      rel={onPage ? undefined : 'noopener noreferrer'}
    >
      {children}
    </a>
  );
}

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
      <Content components={{
        // Map the HTML elements to React components
        a: (props) => <Link children={props.children} href={props.href} />,
        prism : (props) => <RenderPrism code={props.code} lang={props.lang} meta={props.meta}/>
      }}/>
  </React.StrictMode>
);