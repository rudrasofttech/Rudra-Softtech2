/**
 * generate-icons.js
 *
 * Reads every SVG file from node_modules/bootstrap-icons/icons/,
 * extracts the SVG element data, auto-categorizes by name-prefix,
 * and writes src/components/designeditor/icons.js.
 *
 * Usage (from project root):
 *   node scripts/generate-icons.js
 */

const fs   = require('fs');
const path = require('path');

const ICONS_DIR   = path.join(__dirname, '../node_modules/bootstrap-icons/icons');
const OUTPUT_FILE = path.join(__dirname, '../src/components/designeditor/icons.js');

// ─── Category map: icon name prefix → display category ───────────────────────
const CAT = {
  // Arrows
  arrow:'Arrows', arrows:'Arrows', chevron:'Arrows', caret:'Arrows',
  skip:'Arrows', fast:'Arrows', rewind:'Arrows', forward:'Arrows',
  back:'Arrows', dpad:'Arrows',

  // Shapes & Symbols
  circle:'Shapes', square:'Shapes', triangle:'Shapes', diamond:'Shapes',
  hexagon:'Shapes', octagon:'Shapes', pentagon:'Shapes', heptagon:'Shapes',
  star:'Shapes', stars:'Shapes', heart:'Shapes', heartbreak:'Shapes', hearts:'Shapes',
  infinity:'Shapes', bullseye:'Shapes', patch:'Shapes', dot:'Shapes',
  intersect:'Shapes', union:'Shapes', subtract:'Shapes', exclude:'Shapes',
  cone:'Shapes', bounding:'Shapes', symmetry:'Shapes',
  gem:'Shapes', hypnotize:'Shapes', line:'Shapes',
  crosshair:'Shapes', crosshair2:'Shapes',
  valentine:'Shapes', valentine2:'Shapes', peace:'Shapes', yin:'Shapes',
  life:'Shapes', asterisk:'Shapes',

  // Emoji
  emoji:'Emoji',

  // Communication
  chat:'Communication', telephone:'Communication', phone:'Communication',
  envelope:'Communication', rss:'Communication', broadcast:'Communication',
  megaphone:'Communication', voicemail:'Communication', inbox:'Communication',
  inboxes:'Communication', mailbox:'Communication', mailbox2:'Communication',
  send:'Communication', reply:'Communication', quote:'Communication',
  speaker:'Communication', at:'Communication', signal:'Communication',

  // Social Platforms
  facebook:'Social', twitter:'Social', instagram:'Social', linkedin:'Social',
  youtube:'Social', github:'Social', discord:'Social', slack:'Social',
  whatsapp:'Social', telegram:'Social', reddit:'Social', pinterest:'Social',
  tiktok:'Social', snapchat:'Social', mastodon:'Social', dribbble:'Social',
  bluesky:'Social', threads:'Social', twitch:'Social', vimeo:'Social',
  behance:'Social', medium:'Social', quora:'Social', yelp:'Social',
  strava:'Social', trello:'Social', substack:'Social', skype:'Social',
  messenger:'Social', wechat:'Social', sina:'Social', tencent:'Social',
  opencollective:'Social', sourceforge:'Social', wordpress:'Social',
  perplexity:'Social', anthropic:'Social', openai:'Social', claude:'Social',

  // Brands & Dev tools
  amazon:'Brand', apple:'Brand', google:'Brand', microsoft:'Brand',
  bootstrap:'Brand', meta:'Brand', nvidia:'Brand', paypal:'Brand',
  stripe:'Brand', steam:'Brand', xbox:'Brand', nintendo:'Brand',
  playstation:'Brand', ubuntu:'Brand', windows:'Brand', android:'Brand',
  android2:'Brand', tux:'Brand', alexa:'Brand', bing:'Brand',
  spotify:'Brand', alipay:'Brand', git:'Brand', gitlab:'Brand',
  wikipedia:'Brand', amd:'Brand', dropbox:'Brand',
  terminal:'Brand', code:'Brand', braces:'Brand', typescript:'Brand',
  javascript:'Brand', css:'Brand', node:'Brand', unity:'Brand',
  robot:'Brand',

  // Files & Documents
  file:'Files', files:'Files', filetype:'Files', folder:'Files', folder2:'Files',
  journal:'Files', journals:'Files', archive:'Files', save:'Files', save2:'Files',
  floppy:'Files', floppy2:'Files', postage:'Files', postcard:'Files',
  bookmark:'Files', bookmarks:'Files', stickies:'Files', sticky:'Files',
  pass:'Files', passport:'Files', receipt:'Files', clipboard:'Files',
  clipboard2:'Files', copy:'Files', bookshelf:'Files', book:'Files',
  newspaper:'Files', paperclip:'Files', upc:'Files', qr:'Files',

  // People & Body
  person:'People', people:'People', gender:'People', body:'People',
  hand:'People', lungs:'People', mask:'People', eyeglasses:'People',
  sunglasses:'People', ear:'People',

  // Media & Audio
  music:'Media', play:'Media', pause:'Media', stop:'Media',
  record:'Media', record2:'Media', film:'Media', camera:'Media', camera2:'Media',
  image:'Media', images:'Media', collection:'Media', mic:'Media',
  volume:'Media', headphones:'Media', headset:'Media', cassette:'Media',
  vinyl:'Media', boombox:'Media', eject:'Media', tv:'Media',
  soundwave:'Media', earbuds:'Media', pip:'Media', cast:'Media',
  disc:'Media', shuffle:'Media', repeat:'Media',

  // Charts & Data
  graph:'Charts', bar:'Charts', pie:'Charts', diagram:'Charts',
  kanban:'Charts', database:'Charts', radar:'Charts', activity:'Charts',
  reception:'Charts', speedometer:'Charts', speedometer2:'Charts',

  // Maps, Places & Buildings
  geo:'Maps', map:'Maps', compass:'Maps', pin:'Maps',
  signpost:'Maps', globe:'Maps', globe2:'Maps', sign:'Maps',
  house:'Maps', houses:'Maps', building:'Maps', buildings:'Maps',
  door:'Maps', hospital:'Maps',

  // Transport
  train:'Transport', bus:'Transport', car:'Transport', taxi:'Transport',
  truck:'Transport', scooter:'Transport', bicycle:'Transport', airplane:'Transport',
  ev:'Transport', fuel:'Transport', minecart:'Transport', rocket:'Transport',

  // Devices & Hardware
  device:'Devices', pc:'Devices', laptop:'Devices', tablet:'Devices',
  smartwatch:'Devices', printer:'Devices', projector:'Devices',
  keyboard:'Devices', mouse:'Devices', mouse2:'Devices', mouse3:'Devices',
  cpu:'Devices', hdd:'Devices', ssd:'Devices', nvme:'Devices',
  usb:'Devices', sd:'Devices', memory:'Devices', router:'Devices',
  modem:'Devices', server:'Devices', webcam:'Devices', bluetooth:'Devices',
  wifi:'Devices', ethernet:'Devices', hdmi:'Devices', displayport:'Devices',
  optical:'Devices', pci:'Devices', motherboard:'Devices', gpu:'Devices',
  vr:'Devices', joystick:'Devices', controller:'Devices', watch:'Devices',
  display:'Devices', plugin:'Devices', outlet:'Devices', plug:'Devices',
  battery:'Devices', sim:'Devices', browser:'Devices', fan:'Devices',
  power:'Devices',

  // Finance & Commerce
  currency:'Finance', cash:'Finance', credit:'Finance', bank:'Finance',
  bank2:'Finance', wallet:'Finance', wallet2:'Finance', coin:'Finance',
  piggy:'Finance', cart:'Finance', cart2:'Finance', cart3:'Finance',
  cart4:'Finance', bag:'Finance', handbag:'Finance', basket:'Finance',
  basket2:'Finance', basket3:'Finance', shop:'Finance', ticket:'Finance',
  gift:'Finance', percent:'Finance', calculator:'Finance', card:'Finance',
  briefcase:'Finance',

  // Security
  shield:'Security', lock:'Security', unlock:'Security', unlock2:'Security',
  key:'Security', safe:'Security', safe2:'Security', incognito:'Security',
  fingerprint:'Security',

  // Nature & Weather
  cloud:'Nature', clouds:'Nature', cloudy:'Nature', sun:'Nature',
  moon:'Nature', snow:'Nature', snow2:'Nature', snow3:'Nature',
  lightning:'Nature', wind:'Nature', umbrella:'Nature', rainbow:'Nature',
  thermometer:'Nature', tsunami:'Nature', tornado:'Nature', hurricane:'Nature',
  tree:'Nature', flower1:'Nature', flower2:'Nature', flower3:'Nature',
  leaf:'Nature', feather:'Nature', feather2:'Nature', bug:'Nature',
  water:'Nature', droplet:'Nature', moisture:'Nature', tropical:'Nature',
  fire:'Nature', binoculars:'Nature', sunrise:'Nature', sunset:'Nature',
  thunderbolt:'Nature', recycle:'Nature', radioactive:'Nature',

  // Tools & Design
  tools:'Tools', wrench:'Tools', hammer:'Tools', gear:'Tools', scissors:'Tools',
  ruler:'Tools', rulers:'Tools', pencil:'Tools', pen:'Tools',
  eraser:'Tools', palette:'Tools', palette2:'Tools', paint:'Tools',
  brush:'Tools', bucket:'Tools', eyedropper:'Tools', magic:'Tools',
  wand:'Tools', crop:'Tools', bezier:'Tools', bezier2:'Tools',
  vector:'Tools', easel:'Tools', easel2:'Tools', easel3:'Tools',
  highlighter:'Tools', marker:'Tools', screwdriver:'Tools', nut:'Tools',
  magnet:'Tools', ladder:'Tools', lamp:'Tools', lightbulb:'Tools',
  beaker:'Tools', flask:'Tools', microscope:'Tools',
  transparency:'Tools', vignette:'Tools', brightness:'Tools', exposure:'Tools',
  highlights:'Tools', shadows:'Tools', sliders:'Tools', sliders2:'Tools',
  noise:'Tools', brilliance:'Tools', measuring:'Tools',

  // Typography
  type:'Typography', text:'Typography', fonts:'Typography', paragraph:'Typography',
  blockquote:'Typography', hr:'Typography', justify:'Typography',
  indent:'Typography', unindent:'Typography', align:'Typography',
  subscript:'Typography', superscript:'Typography', spellcheck:'Typography',
  textarea:'Typography', input:'Typography', markdown:'Typography',
  translate:'Typography', hash:'Typography', regex:'Typography',

  // Layout
  layout:'Layout', columns:'Layout', rows:'Layout', grid:'Layout',
  table:'Layout', app:'Layout', window:'Layout', fullscreen:'Layout',
  aspect:'Layout', stoplights:'Layout', segmented:'Layout',
  layers:'Layout', layer:'Layout', stack:'Layout', distribute:'Layout',
  front:'Layout', border:'Layout', bricks:'Layout',

  // General UI Controls
  check:'UI', check2:'UI', x:'UI', plus:'UI', dash:'UI',
  slash:'UI', cursor:'UI', zoom:'UI', filter:'UI', funnel:'UI',
  sort:'UI', search:'UI', eye:'UI', list:'UI', menu:'UI',
  three:'UI', toggle:'UI', toggle2:'UI', toggles:'UI', toggles2:'UI',
  trash:'UI', trash2:'UI', trash3:'UI', bell:'UI',
  calendar:'UI', calendar2:'UI', calendar3:'UI', calendar4:'UI', clock:'UI',
  alarm:'UI', stopwatch:'UI', hourglass:'UI',
  download:'UI', upload:'UI', share:'UI', link:'UI',
  tag:'UI', tags:'UI', info:'UI', question:'UI', exclamation:'UI',
  ban:'UI', badge:'UI', box:'UI', box2:'UI', boxes:'UI', grip:'UI',
  cc:'UI', view:'UI', backspace:'UI', alt:'UI', option:'UI',
  escape:'UI', command:'UI', shift:'UI', capslock:'UI',
  universal:'UI', ui:'UI',

  // Health & Medical
  bandaid:'Health', capsule:'Health', virus:'Health', virus2:'Health',
  prescription:'Health', prescription2:'Health',

  // Food & Drink
  cup:'Food', cake:'Food', cake2:'Food', egg:'Food',
  fork:'Food', cookie:'Food',

  // Travel & Luggage
  suitcase:'Travel', suitcase2:'Travel', duffle:'Travel',
  luggage:'Travel', backpack:'Travel', backpack2:'Travel',
  backpack3:'Travel', backpack4:'Travel',

  // Games & Awards
  dice:'Games', puzzle:'Games', suit:'Games', balloon:'Games',
  trophy:'Games', award:'Games', mortarboard:'Games',
  flag:'Games', explicit:'Media',

  // Numeric
  '0':'Alphanumeric', '1':'Alphanumeric', '2':'Alphanumeric', '3':'Alphanumeric',
  '4':'Alphanumeric', '5':'Alphanumeric', '6':'Alphanumeric', '7':'Alphanumeric',
  '8':'Alphanumeric', '9':'Alphanumeric', '123':'Alphanumeric',
  h:'Alphanumeric', p:'Alphanumeric', r:'Alphanumeric', c:'Alphanumeric',
  alphabet:'Alphanumeric',
};

// ─── Ordered category list (controls display order in ShapePicker) ────────────
const ORDERED_CATS = [
  'Arrows', 'Shapes', 'Emoji', 'UI',
  'Communication', 'Social', 'Brand',
  'Files', 'People', 'Media', 'Charts',
  'Maps', 'Transport', 'Devices',
  'Finance', 'Security',
  'Nature', 'Tools', 'Typography', 'Layout',
  'Health', 'Food', 'Travel', 'Games',
  'Alphanumeric', 'Other',
];

// ─── Helper: prettify icon filename to display label ─────────────────────────
function toLabel(name) {
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Helper: extract SVG child elements ──────────────────────────────────────
function extractElements(svgText) {
  const elems = [];
  const elemRe = /<(path|circle|rect|line|polygon|polyline|ellipse)\s([^>]*?)\s*\/?>/gi;
  let m;
  while ((m = elemRe.exec(svgText)) !== null) {
    const tag = m[1].toLowerCase();
    const attrsStr = m[2];
    const attrs = {};
    const attrRe = /([\w-]+)="([^"]*)"/g;
    let am;
    while ((am = attrRe.exec(attrsStr)) !== null) {
      const k = am[1], v = am[2];
      if (k === 'fill' || k === 'class' || k === 'style') continue;
      attrs[k] = v;
    }
    if (Object.keys(attrs).length > 0) elems.push({ tag, attrs });
  }
  return elems;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg')).sort();
console.log(`Found ${files.length} icons`);

const catalog = [];

for (const file of files) {
  const name = file.replace(/\.svg$/, '');
  const prefix = name.split('-')[0].toLowerCase();
  const iconCategory = CAT[prefix] || 'Other';
  const svgText = fs.readFileSync(path.join(ICONS_DIR, file), 'utf8');
  const elements = extractElements(svgText);
  if (elements.length === 0) { console.warn(`  SKIP: ${file}`); continue; }
  catalog.push({ id: `icon-${name}`, label: toLabel(name), iconCategory, elements });
}

console.log(`Processed ${catalog.length} icons`);

// Count per category
const usedCats = [...new Set(catalog.map(i => i.iconCategory))];
const sortedCats = [
  ...ORDERED_CATS.filter(c => usedCats.includes(c)),
  ...usedCats.filter(c => !ORDERED_CATS.includes(c)).sort(),
];

const catCounts = {};
catalog.forEach(i => { catCounts[i.iconCategory] = (catCounts[i.iconCategory]||0)+1; });
sortedCats.forEach(c => console.log(`  ${String(catCounts[c]||0).padStart(4)}  ${c}`));
console.log(`  ----`);
console.log(`  ${String(catalog.length).padStart(4)}  TOTAL`);

// ─── Build JS output ─────────────────────────────────────────────────────────
const lines = [];
lines.push(`/**`);
lines.push(` * icons.js — Bootstrap Icons catalog for the design editor.`);
lines.push(` *`);
lines.push(` * AUTO-GENERATED — do not edit by hand.`);
lines.push(` * Source: bootstrap-icons npm package (MIT License)`);
lines.push(` * Run: node scripts/generate-icons.js`);
lines.push(` *`);
lines.push(` * ${catalog.length} icons across ${sortedCats.length} categories.`);
lines.push(` */`);
lines.push(``);
lines.push(`export const ICON_CATEGORIES = ${JSON.stringify(sortedCats)};`);
lines.push(``);
lines.push(`export const ICON_CATALOG = [`);

for (const icon of catalog) {
  const elems = icon.elements.map(({ tag, attrs }) => {
    const parts = Object.entries(attrs).map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`);
    return `{tag:${JSON.stringify(tag)},${parts.join(',')}}`;
  });
  lines.push(
    `  {id:${JSON.stringify(icon.id)},label:${JSON.stringify(icon.label)},` +
    `category:"Icons",iconCategory:${JSON.stringify(icon.iconCategory)},` +
    `iconViewBox:"0 0 16 16",defaultW:60,defaultH:60,svgElement:"icon",` +
    `elements:[${elems.join(',')}]},`
  );
}

lines.push(`];`);
lines.push(``);
lines.push(`export const ICON_BY_ID = Object.fromEntries(ICON_CATALOG.map(i => [i.id, i]));`);

const output = lines.join('\n');
fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
console.log(`\nWritten: ${OUTPUT_FILE}`);
console.log(`Size: ~${Math.round(output.length / 1024)} KB`);
