// Node script to expand public/data/daiy-poems.json to 1000 entries with long, relatable poems
// Safe to run multiple times; it appends new generated poems until target length is reached.

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'public', 'data', 'daiy-poems.json');
const TARGET = 1000;

const categories = [
  'Life','Love','Relationships','Work','Everyday','School','Tears','Healing','Problems','People','Positivity','Regrets','Friendship'
];

function sentence(parts) {
  return parts.filter(Boolean).join(' ') + '\n';
}

function makePoem(index, category) {
  const title = `${category} Notes ${index}`;
  // Build 12-18 lines of realistic, varied content
  const blocks = [];
  const openers = [
    'Morning lays its plans on the table—steam, light, softer intentions.',
    'Tonight the room remembers our names without asking for perfection.',
    'Between errands and small mercies, I practice being a person again.',
    'We count the honest things: water, shoulders, a friend who texts first.',
    'Some days the heart is a long hallway; we learn which lamps to switch on.',
    'I keep returning to the ordinary the way waves return to a shore.',
    'The calendar mispronounced me; I corrected it with a slower breath.',
    'We negotiated with time and paid in laughter and dishes.'
  ];
  const middles = [
    'There is a science to gentleness; it favors repetition over spectacle.',
    'Practice is a kind of prayer that forgives bad weather in the voice.',
    'Regret arrives punctual; forgiveness prefers to walk. We wait together.',
    'Love is maintenance—tighten the screws, oil the hinge, replace the bulb.',
    'Grief conjugates in its own tense; I answer in present kindness.',
    'We are not late; we are learning a clock that keeps mercy as minutes.',
    'Work asks for hours; the body asks to be remembered while giving them.',
    'I study the syllabus of staying: snacks, small naps, unhurried questions.'
  ];
  const closers = [
    'If all I carried today was myself from one moment to the next—enough.',
    'When the horizon felt far, I borrowed a nearer sky from a friend.',
    'I wasn’t a miracle; I was present. The room applauded in quiet.',
    'I watered the plant and the plan; both decided to keep living.',
    'The city stitched us together with small green lights of patience.',
    'I wrote a receipt for joy and kept the day instead of returning it.',
    'The hallway of the heart opened one lamp at a time and I walked through.',
    'I did not fix the world. I made tea and it softened its stance.'
  ];

  const lines = [];
  lines.push(openers[index % openers.length]);
  for (let i = 0; i < 10 + (index % 7); i++) {
    const a = middles[(index + i) % middles.length];
    lines.push(a);
    if (i % 3 === 2) {
      lines.push(''); // paragraph break
    }
  }
  lines.push(closers[index % closers.length]);
  const content = lines.join('\n');
  return { title, category, content };
}

(function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('Missing JSON:', DATA_PATH);
    process.exit(1);
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  let arr = [];
  try { arr = JSON.parse(raw); } catch (e) {
    console.error('Invalid JSON in daiy-poems.json');
    process.exit(2);
  }

  const existingTitles = new Set(arr.map(p => p.title + '|' + p.category));
  let idx = 1;
  while (arr.length < TARGET) {
    const cat = categories[arr.length % categories.length];
    const poem = makePoem(idx, cat);
    const key = poem.title + '|' + poem.category;
    if (existingTitles.has(key)) { idx++; continue; }
    arr.push(poem);
    existingTitles.add(key);
    idx++;
  }

  // Backup
  const backupPath = DATA_PATH.replace(/\.json$/, `.backup_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(JSON.parse(raw), null, 2));

  // Write updated
  fs.writeFileSync(DATA_PATH, JSON.stringify(arr, null, 2));
  console.log('Updated poems:', arr.length);
})();
