// remark-custom-blocks.js
import { visit } from 'unist-util-visit';
import {unified} from 'unified';
import markdown from 'remark-parse';

// Define the supported keywords
const keywords = ['info', 'note', 'tip', 'caution', 'danger'];

export default function remarkCustomBlocks() {
  function transformer(tree) {
    visit(tree, 'paragraph', (node, index, parent) => {
      const firstChild = node.children[0];

      if (
        firstChild &&
        firstChild.type === 'text'
      ) {
        const keywordMatch = firstChild.value.match(/^:::(info|note|tip|caution|danger)/);

        if (keywordMatch) {
          const keyword = keywordMatch[1];

          // Extract the title
          const titleMatch = firstChild.value.match(/^:::(info|note|tip|caution|danger)\s+(.*)$/);
          const title = titleMatch ? titleMatch[2] : '';

          // Remove the keyword from the first child's value
          firstChild.value = firstChild.value.replace(/^:::(info|note|tip|caution|danger)\s*/, '');

          // Find the closing ':::' marker
          const closingIndex = parent.children.slice(index + 1).findIndex(child => {
            return child.type === 'paragraph' && child.children[0] && child.children[0].value === ':::';
          });

          if (closingIndex === -1) {
            return;
          }

          const endIndex = index + 1 + closingIndex;
          const contentNodes = parent.children.slice(index + 1, endIndex);

          // Parse the contentNodes as markdown
          const contentProcessor = unified().use(markdown);
          const contentTree = contentProcessor.runSync({ type: 'root', children: contentNodes });

          const customBlockNode = {
            type: `${keyword}Block`,
            data: {
              hName: 'admonition',
              hProperties: {
                type: keyword,
                title: title, // Include the title property
              },
            },
            children: contentTree.children,
          };

          parent.children.splice(index, endIndex - index + 1, customBlockNode);
        }
      }
    });
  }

  return transformer;
}
