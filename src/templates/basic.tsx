// @ts-ignore
import React from 'react';
// @ts-ignore
import ReactDOM from 'react-dom/client';

// @ts-ignore
import Content from 'MD_SOURCE_PATH'; // to be replaced
// IMPORT_CSS

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
      }}/>
  </React.StrictMode>
);