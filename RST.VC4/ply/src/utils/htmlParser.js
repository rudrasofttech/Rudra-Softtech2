// src/utils/htmlParser.js
// Utility for parsing HTML strings into a node tree structure

/**
 * htmlStringToNodeTree(html)
 * Parses an HTML string into a node tree for the HTML editor.
 * @param {string} html - The HTML string to parse
 * @returns {object} - Node tree representation
 */
export function htmlStringToNodeTree(html) {
  if (typeof window === 'undefined' || !window.DOMParser) return {};
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  function traverse(node) {
    const obj = {
      tag: node.tagName,
      dataSlot: node.getAttribute && node.getAttribute('data-slot'),
      value: node.textContent,
      children: []
    };
    if (node.children && node.children.length) {
      obj.children = Array.from(node.children).map(traverse);
    }
    return obj;
  }
  return traverse(doc.body);
}

