// src/utils/slotUtils.js
// Utilities for slot-based HTML template filling and extraction

/**
 * fillSlots(templateHtml, contentMap, theme)
 * Replaces data-slot attributes in templateHtml with values from contentMap and injects theme variables.
 * @param {string} templateHtml - The raw HTML template string
 * @param {object} contentMap - The content data keyed by section/field
 * @param {object} theme - Theme variables (colors, fonts, etc.)
 * @returns {string} - Rendered HTML string
 */
import { injectThemeVariables } from './themeUtils';

export function fillSlots(templateHtml, contentMap, theme) {
  // Inject theme variables first
  let html = injectThemeVariables(templateHtml, theme);
  // Replace data-slot attributes (simple version)
  if (typeof window !== 'undefined' && window.DOMParser) {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    Object.entries(contentMap || {}).forEach(([section, fields]) => {
      Object.entries(fields || {}).forEach(([key, value]) => {
        // Find all elements with data-slot=`section.key`
        const selector = `[data-slot="${section}.${key}"]`;
        doc.querySelectorAll(selector).forEach(el => {
          if (el.tagName === 'IMG') {
            el.src = value;
          } else if (el.tagName === 'A' && typeof value === 'object' && value.url) {
            el.href = value.url;
            el.textContent = value.label || value.url;
          } else if (el.hasAttribute('contenteditable')) {
            el.innerHTML = value;
          } else {
            el.textContent = value;
          }
        });
      });
    });
    html = doc.documentElement.outerHTML;
  }
  return html;
}

/**
 * extractSlots(nodeTree)
 * Extracts slot-bound content from a node tree (HTML editor) into a contentMap.
 * @param {object} nodeTree - The node tree structure from the HTML editor
 * @returns {object} - contentMap JSON
 */
export function extractSlots(nodeTree) {
  // Simple demo: expects nodeTree as an array of nodes with dataSlot, value
  const contentMap = {};
  if (!nodeTree || !Array.isArray(nodeTree)) return contentMap;
  nodeTree.forEach(node => {
    if (node.dataSlot && node.value !== undefined) {
      const [section, key] = node.dataSlot.split('.');
      if (!contentMap[section]) contentMap[section] = {};
      contentMap[section][key] = node.value;
    }
    // Recursively extract from children
    if (node.children && node.children.length) {
      const childMap = extractSlots(node.children);
      Object.entries(childMap).forEach(([section, fields]) => {
        if (!contentMap[section]) contentMap[section] = {};
        Object.assign(contentMap[section], fields);
      });
    }
  });
  return contentMap;
}

