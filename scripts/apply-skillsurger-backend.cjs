const fs = require('node:fs');
const path = require('node:path');
const backend = path.resolve(process.argv[2] || '');
const expected = path.resolve('C:/Users/Hardy/Desktop/Intervue-Backend');
if (backend !== expected) throw new Error('Expected the explicit Intervue-Backend checkout.');
const target = path.join(backend, 'app/services/openai.service.js');
const helper = path.join(backend, 'app/services/skillsurger-factual-cv.cjs');
let source = fs.readFileSync(target, 'utf8');
const a = source.indexOf('exports.enhanceCVText = async (');
const b = source.indexOf('exports.generateVerifiedLearningResources = async (', a);
if (a < 0 || b < 0) throw new Error('Could not locate Skillsurger enhancement boundaries.');
// Save original outside versioned files for review/rollback; preserve all other service code.
fs.mkdirSync('artifacts/backend-backup', { recursive: true });
if (!fs.existsSync('artifacts/backend-backup/openai.service.js')) fs.copyFileSync(target, 'artifacts/backend-backup/openai.service.js');
source = source.slice(0, a) + `exports.enhanceCVText = async (cvText, targetRole = null, existingProjects = null, progressCallback = null) => {
  if (progressCallback) progressCallback('Formatting your supplied resume without changing facts...', { step: 10 });
  const result = require('./skillsurger-factual-cv.cjs').formatFactualCV(cvText);
  if (progressCallback) progressCallback('Formatting complete. Add verified metrics to your source resume where needed.', { step: 100 });
  return result;
};

` + source.slice(b);
fs.copyFileSync('backend-patches/skillsurger-factual-cv.cjs', helper);
fs.writeFileSync(target, source);
console.log('Applied Skillsurger-only CV factuality helper; other product functions preserved.');
