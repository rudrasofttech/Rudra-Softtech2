// Check which icon name prefixes have no category mapping
const catalog = require('fs').readFileSync('src/components/designeditor/icons.js','utf8');
const ids = catalog.match(/id:"icon-([^"]+)"/g).map(m => m.replace('id:"icon-','').replace('"',''));
const otherPrefixes = {};
ids.forEach(name => {
  const prefix = name.split('-')[0].toLowerCase();
  // Simple recreation of PREFIX_CATEGORY (just check what's NOT mapped)
  const known = new Set(['arrow','arrows','chevron','caret','skip','fast','rewind','forward','back','next','dpad',
    'circle','square','triangle','diamond','hexagon','octagon','pentagon','heptagon','star','stars','heart','heartbreak','hearts',
    'infinity','bullseye','patch','dot','intersect','union','subtract','exclude','cone','bounding','symmetry','slash',
    'emoji','chat','telephone','phone','envelope','rss','broadcast','megaphone','voicemail','inbox','inboxes','mailbox',
    'send','reply','quote','facebook','twitter','instagram','linkedin','youtube','github','discord','slack',
    'whatsapp','telegram','reddit','pinterest','tiktok','snapchat','mastodon','dribbble','bluesky','threads','twitch',
    'vimeo','behance','medium','quora','yelp','strava','trello','substack','skype','messenger','wechat','sina',
    'tencent','opencollective','sourceforge','wordpress','perplexity','anthropic','openai','claude',
    'amazon','apple','google','microsoft','bootstrap','meta','nvidia','paypal','stripe','steam','xbox','nintendo',
    'playstation','ubuntu','windows','android','android2','tux','alexa','bing','spotify','alipay','git','gitlab',
    'wikipedia','amd',
    'file','files','filetype','folder','folder2','journal','journals','archive','save','save2','floppy','floppy2',
    'postage','postcard','bookmark','bookmarks','stickies','sticky','pass','passport','receipt','clipboard','clipboard2',
    'copy','bookshelf',
    'person','people','gender','body','hand','lungs',
    'music','play','pause','stop','record','record2','film','camera','camera2','image','images','collection','mic',
    'volume','headphones','headset','cassette','vinyl','boombox','eject','tv','soundwave','earbuds','pip','cast',
    'graph','bar','pie','diagram','kanban','database','radar','activity','reception','speedometer','speedometer2',
    'geo','map','compass','pin','signpost','globe','globe2',
    'device','pc','laptop','tablet','smartwatch','printer','projector','keyboard','mouse','mouse2','mouse3',
    'cpu','hdd','ssd','nvme','usb','sd','memory','router','modem','server','webcam','bluetooth','wifi','ethernet',
    'hdmi','displayport','optical','pci','motherboard','gpu','vr','joystick','controller','watch','display',
    'plugin','outlet','plug','battery',
    'currency','cash','credit','bank','bank2','wallet','wallet2','coin','piggy','cart','cart2','cart3','cart4',
    'bag','handbag','basket','basket2','basket3','shop','ticket','gift','percent',
    'shield','lock','unlock','unlock2','key','safe','safe2','incognito','fingerprint',
    'cloud','clouds','cloudy','sun','moon','snow','snow2','snow3','lightning','wind','umbrella','rainbow',
    'thermometer','tsunami','tornado','hurricane','tree','flower1','flower2','flower3','leaf','feather','feather2',
    'bug','water','droplet','moisture','tropical','fire','radioactive','binoculars',
    'tools','wrench','hammer','gear','scissors','ruler','rulers','pencil','pen','eraser','palette','palette2',
    'paint','brush','bucket','eyedropper','magic','wand','crop','bezier','bezier2','vector','easel','easel2','easel3',
    'highlighter','marker','screwdriver','nut','magnet','ladder','lamp','lightbulb','beaker','flask',
    'transparency','vignette','brightness','exposure','highlights','shadows','sliders','sliders2','noise','brilliance',
    'type','text','fonts','paragraph','blockquote','hr','justify','indent','unindent','align','subscript',
    'superscript','spellcheck','textarea','input','markdown','regex',
    'layout','columns','rows','grid','table','app','window','fullscreen','aspect','stoplights','segmented',
    'layers','layer','stack','distribute','front',
    '0','1','2','3','4','5','6','7','8','9','123','h','p','r','c']);
  if (!known.has(prefix)) {
    otherPrefixes[prefix] = (otherPrefixes[prefix] || 0) + 1;
  }
});
Object.entries(otherPrefixes).sort((a,b)=>b[1]-a[1]).forEach(([p,n])=>console.log(String(n).padStart(4), p));
console.log('---');
console.log(String(Object.values(otherPrefixes).reduce((a,b)=>a+b,0)).padStart(4),'total uncategorized prefixes');
