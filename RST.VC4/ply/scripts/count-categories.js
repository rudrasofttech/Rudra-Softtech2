const catalog = require('fs').readFileSync('src/components/designeditor/icons.js','utf8');
const matches = catalog.match(/iconCategory:"([^"]+)"/g) || [];
const counts = {};
matches.forEach(m => {
  const cat = m.replace('iconCategory:"','').replace('"','');
  counts[cat] = (counts[cat] || 0) + 1;
});
Object.entries(counts).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(String(n).padStart(5), c));
console.log('-----');
console.log(String(Object.values(counts).reduce((a,b)=>a+b,0)).padStart(5), 'TOTAL');
