// @ts-ignore
import clsx from 'clsx';
// @ts-ignore
import copy from 'copy-text-to-clipboard';
// @ts-ignore
import React from 'react';

import './css/vars.css'
import './css/copy-button.css'
import './css/link.css'
import './css/prism-plus.css'

interface CopyButtonProps {
  readonly code: string;
  readonly className?: string;
}

const CopyButton = ({code, className}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = React.useState(false);
  const copyTimeout = React.useRef<number | undefined>(undefined);
  const handleCopyCode = React.useCallback(() => {
    copy(code);
    setIsCopied(true);
    copyTimeout.current = window.setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }, [code]);

  React.useEffect(() => () => window.clearTimeout(copyTimeout.current), []);

  return (
    <button
      type="button"
      aria-label={
        isCopied
          ? 'Copied'
          : 'Copy code to clipboard'
      }
      title={'Copy'}
      className={clsx(
        'copyButton',
        isCopied && 'copyButtonCopied',
      )}

      onClick={handleCopyCode}>
      <span className={'copyButtonIcons'} aria-hidden="true">
        { isCopied
          ? <svg className={'copyButtonSuccessIcon'} viewBox="0 0 24 24">
              <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
            </svg>
          : <svg className={'copyButtonIcon'} viewBox="0 0 24 24">
              <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
            </svg>
        }
      </span>
    </button>
  );
}

const CodeFrame = ({ code, children } : { children : any, code : any }) => {
  return <div className={'codeFrame'}>
    <CopyButton code={code}></CopyButton>
    { children }
  </div>
}


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

// Map HTML elements to React components
export const getComponents = () => {
  return {
    a: (props : any) => <Link children={props.children} href={props.href} />,
    codeframe : (props : any) => <CodeFrame code={props.code} children={props.children}/>
  }
}
