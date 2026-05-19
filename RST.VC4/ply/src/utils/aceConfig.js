// aceConfig.js
import ace from "ace-builds";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-github";

ace.config.set(
  "workerPath",
  "https://cdn.jsdelivr.net/npm/ace-builds@" +
    ace.version +
    "/src-noconflict/"
);

export const editorConfig = {
  mode: "html",
  theme: "github",
  setOptions: {
    useWorker: true,
  },
};
