import './css/table.css'
import './css/code.css'
import './css/link.css'
import './css/vars.css'

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
    //admonition: (props : any) => <Admonition type={props.type} title={props.title} children={props.children} />
  }
}
