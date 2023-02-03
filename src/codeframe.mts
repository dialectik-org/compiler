//import { visit } from 'unist-util-visit'
import { map, MapFunction } from 'unist-util-map'

/**
 * Adds a prism frame tag to the code block, typically to add a copy/paste button
 * @param node
 * @returns
 */

const mf : MapFunction<any> = (node : any) => {
  if (node.type == 'code') {
    const n = {
      type: 'mdxJsxFlowElement',
      name: 'codeframe',
      attributes : [ /*{
        type: 'mdxJsxAttribute',
        name: 'lang',
        value: node.lang
      }, {
        type: 'mdxJsxAttribute',
        name: 'meta',
        value: node.meta
      },*/ {
        type: 'mdxJsxAttribute',
        name: 'code',
        value: node.value
      } ],
      children : [node]
    }
    return n
  }
  return node
}

export const remarkCodeFrame = () => (tree : any) => {
  return map(tree, mf)
}