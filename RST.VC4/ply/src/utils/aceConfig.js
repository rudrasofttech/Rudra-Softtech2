// aceConfig.js
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/worker-html";

export const editorConfig = {
  mode: "html",
  theme: "github",
  setOptions: {
    useWorker: true, // or false if you don’t need linting
  },
};
