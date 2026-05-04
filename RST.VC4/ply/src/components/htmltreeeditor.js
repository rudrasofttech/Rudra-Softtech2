
import React from "react";
import AceEditor from "react-ace";
import { editorConfig } from "../utils/aceConfig";
import { HTMLHint } from "htmlhint";
import ace from "ace-builds/src-noconflict/ace";

export default function HtmlTreeEditor({html, onChange }) {
  // Custom validation function
  const validateHtml = (editor, code) => {
    const results = HTMLHint.verify(code);
    const annotations = results.map((err) => ({
      row: err.line - 1, // Ace rows are 0-based
      column: err.col - 1,
      text: err.message,
      type: "error" // or "warning"
    }));
    editor.getSession().setAnnotations(annotations);
  };
  // Code editor removed. Implement your tree editor UI here.
   return (
     <AceEditor
      mode={editorConfig.mode}
      theme={editorConfig.theme}
      name="html-editor"
      width="100%"
      height="80vh"
      value={html}
      setOptions={editorConfig.setOptions}
      onChange={onChange} 
      fontSize={17}
      lineHeight={20}
      showPrintMargin={true}
      showGutter={true}
      highlightActiveLine={true}
      onLoad={(editor) => {
        // Run validation initially
        validateHtml(editor, html);

        // Re-run validation on every change
        editor.getSession().on("change", () => {
          validateHtml(editor, editor.getValue());
        });
      }}
      editorProps={{ $blockScrolling: true }}
    />
  );
}
