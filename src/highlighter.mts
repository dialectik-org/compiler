//import { visit } from 'unist-util-visit'
import { map, MapFunction } from 'unist-util-map'

const mf : MapFunction<any> = (node : any) => {
  if (node.type == 'code') {
    const n = {
      type: 'mdxJsxFlowElement',
      name: 'prism',
      attributes : [ {
        type: 'mdxJsxAttribute',
        name: 'lang',
        value: node.lang
      }, {
        type: 'mdxJsxAttribute',
        name: 'meta',
        value: node.meta
      }, {
        type: 'mdxJsxAttribute',
        name: 'code',
        value: node.value
      } ],
      children : []
    }
    return n
  }
  return node
}

export const remarkHighlighter = () => (tree : any) => {
  return map(tree, mf)
}