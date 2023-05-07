import './css/code.css'
import './css/link.css'
import './css/table.css'
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
// @ts-ignore
import { Card, Code, Heading, Text, Alert, AlertIcon, AlertTitle, Box, AlertDescription, UnorderedList, ListItem, OrderedList, Table, TableContainer, Thead, Tbody, Tr, Td, Th, Link as ChLink, CardBody } from '@chakra-ui/react'

interface AdmonitionProps {
  type: string;
  title: string | undefined;
  children: React.ReactNode;
}

export const Admonition = ({ type, title, children } : AdmonitionProps) => {
  const getTitle = () => {
    if (title) {
      return title
    } else {
      switch (type) {
        case 'info':
          return 'Info';
        case 'note':
          return 'Note';
        case 'tip':
          return 'Tip';
        case 'caution':
          return 'Caution';
        case 'danger':
          return 'Danger';
        default:
          return '';
      }
    }
  };
  const getStatus = () => {
    switch (type) {
      case 'info':
        return 'info';
      case 'tip':
        return 'success';
      case 'caution':
        return 'warning';
      case 'danger':
        return 'error';
      default:
        return 'info';
    }
  }
  return (
    <Alert variant='left-accent' status={getStatus()} mb='1rem' mt='0rem' borderRadius='4px' >
      <AlertIcon />
      <Box>
        <AlertTitle>{getTitle()}</AlertTitle>
        <AlertDescription>
        {children}
        </AlertDescription>
      </Box>
    </Alert>
  )
}

interface ChakraTableProps {
  children: React.ReactNode;
}

const ChakraTable = (props : ChakraTableProps) => {
  return (
    <Card variant={'outline'} borderRadius={'4px'}>
      <CardBody>
        <TableContainer mb='1rem'>
          <Table variant='striped'>
            {props.children}
          </Table>
        </TableContainer>
      </CardBody>
    </Card>
  )
}

const ChakraLink = ({ children, href } : { children : any, href : any }) => {
  // Check if the link is for a section on the page
  // We don't want to add the attributes for the on page links
  const onPage : boolean = href.startsWith('#');
  return (
    <ChLink
      color='primary'
      href={href}
      isExternal={!onPage}
    >
      {children}
    </ChLink>
  );
}

export const getChakraComponents = () => {
  return {
    h1: (props : any) => <Heading as='h1' size='2xl' mt='0rem' mb='1.25rem' children={props.children} />,
    h2: (props : any) => <Heading as='h2' size='xl' mt='3rem' mb='0.5rem' children={props.children} />,
    h3: (props : any) => <Heading as='h3' size='lg' children={props.children} />,
    p: (props : any) => <Text fontSize='lg' mt='0rem' mb='1.25rem'  lineHeight='1.7' children={props.children} />,
    ul: (props : any) => <UnorderedList mb='1.15rem' children={props.children} />,
    li: (props : any) => <ListItem mt='0.25rem' children={props.children}/>,
    ol: (props : any) => <OrderedList children={props.children}/>,
    del: (props : any) => <Text as='del' children={props.children} />,
    code: (props : any) => <Code children={props.children} />,
    admonition : (props : any) => <Admonition type={props.type} title={props.title} children={props.children} />,
    b: (props : any) => <Text as='b' children={props.children} />,
    i: (props : any) => <Text as='i' children={props.children} />,
    u: (props : any) => <Text as='u' children={props.children} />,
    table: (props : any) => <ChakraTable children={props.children} />,
    thead: (props : any) => <Thead children={props.children} />,
    tbody: (props : any) => <Tbody children={props.children} />,
    tr: (props : any) => <Tr children={props.children} />,
    td: (props : any) => <Td children={props.children} />,
    th: (props : any) => <Th children={props.children} />,
    a: (props : any) => <ChakraLink children={props.children} href={props.href} />,
  }
}
