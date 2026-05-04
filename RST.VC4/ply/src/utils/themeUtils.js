// src/utils/themeUtils.js
// Utility for injecting theme variables into HTML templates

/**
 * injectThemeVariables(html, theme)
 * Injects CSS variables for theme into the HTML string.
 * @param {string} html - The HTML string
 * @param {object} theme - Theme variables (primaryColor, secondaryColor, headingFont, bodyFont, borderRadius)
 * @returns {string} - HTML with injected <style> for theme variables
 */
export function injectThemeVariables(html, theme) {
  if (!theme) return html;
  const cssVars = [
    theme.primaryColor ? `--primary: ${theme.primaryColor};` : '',
    theme.secondaryColor ? `--secondary: ${theme.secondaryColor};` : '',
    theme.headingFont ? `--heading-font: ${theme.headingFont};` : '',
    theme.bodyFont ? `--body-font: ${theme.bodyFont};` : '',
    theme.borderRadius ? `--radius: ${theme.borderRadius};` : ''
  ].filter(Boolean).join('\n  ');
  const styleBlock = `<style>:root {\n  ${cssVars}\n}</style>`;
  // Inject into <head>
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${styleBlock}`);
  } else {
    return styleBlock + html;
  }
}

