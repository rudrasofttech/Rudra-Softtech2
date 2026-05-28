const t = require('fs').readFileSync('src/components/designeditor/icons.js','utf8');
const ids = [];
let i = 0;
while (true) {
  const idx = t.indexOf('iconCategory:"Other"', i);
  if (idx === -1) break;
  const start = t.lastIndexOf('{id:', idx);
  const end = t.indexOf('},', idx) + 2;
  const chunk = t.slice(start, Math.min(start+100, end));
  ids.push(chunk);
  i = idx + 1;
}
ids.forEach(x => console.log(x));
