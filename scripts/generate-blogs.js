/*
  Generator: Convert DOCX blogs in DOCS/ to a consumable TS module at src/content/blogs.generated.ts
*/
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, '..', 'DOCS');
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'content');
const OUT_FILE = path.join(OUT_DIR, 'blogs.generated.ts');

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .replace(/-{2,}/g, '-');
}

function estimateReadTime(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function extractExcerpt(html) {
  // Grab first paragraph text up to ~220 chars
  const text = html
    .replace(/<[^>]+>/g, ' ') // strip tags
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
  if (!text) return '';
  return text.length > 220 ? text.slice(0, 217).trimEnd() + '…' : text;
}

function normalizeName(str) {
  return str
    .toLowerCase()
    .replace(/\.(docx|png|jpg|jpeg|webp)$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findMatchingImageForTitle(title) {
  const target = normalizeName(title);
  const files = fs.readdirSync(PUBLIC_DIR);
  const imageFiles = files.filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));

  // First pass: exact normalized match
  for (const img of imageFiles) {
    if (normalizeName(img) === target) return `/${img}`;
  }
  // Second pass: startsWith/contains
  for (const img of imageFiles) {
    const norm = normalizeName(img);
    if (norm.startsWith(target) || target.startsWith(norm) || norm.includes(target)) {
      return `/${img}`;
    }
  }
  // Third pass: match first 4 words
  const firstWords = target.split(' ').slice(0, 4).join(' ');
  for (const img of imageFiles) {
    if (normalizeName(img).includes(firstWords)) return `/${img}`;
  }
  return '';
}

function guessCategory(title) {
  const t = title.toLowerCase();
  if (t.includes('interview')) return 'Interview Prep';
  if (t.includes('resume') || t.includes('résumé')) return 'Resume Building';
  if (t.includes('linkedin')) return 'Career Development';
  if (t.includes('remote')) return 'Career Advice';
  if (t.includes('data') || t.includes('ai')) return 'Career Development';
  return 'Career Advice';
}

async function convertDocxToHtml(filePath) {
  const buffer = fs.readFileSync(filePath);
  const { value: html } = await mammoth.convertToHtml({ buffer }, {
    styleMap: [
      'p[style-name="Title"] => h1:fresh',
      'p[style-name="Heading 1"] => h2:fresh',
      'p[style-name="Heading 2"] => h3:fresh',
    ],
  });
  return html;
}

async function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`DOCS directory not found at ${DOCS_DIR}`);
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.toLowerCase().endsWith('.docx'));
  const posts = [];

  for (const file of files) {
    const full = path.join(DOCS_DIR, file);
    const baseTitle = file.replace(/\.docx$/i, '');
    const title = baseTitle;
    const slug = toSlug(title);
    try {
      const html = await convertDocxToHtml(full);
      const excerpt = extractExcerpt(html);
      const readTime = estimateReadTime(html);
      const image = findMatchingImageForTitle(title);
      const stats = fs.statSync(full);
      const date = new Date(stats.mtimeMs).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      posts.push({
        slug,
        title,
        excerpt,
        category: guessCategory(title),
        readTime,
        date,
        author: 'Skillsurger Team',
        image: image || 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        content: html,
      });
    } catch (err) {
      console.warn(`Failed to convert ${file}:`, err.message);
    }
  }

  // Deduplicate by slug (prefer latest mtime order already implied)
  const seen = new Set();
  const unique = posts.filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)));

  const ts = `// AUTO-GENERATED FILE. Do not edit manually. Run npm run generate:blogs
export type GeneratedBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  image: string;
  content: string; // HTML
};

export const generatedBlogs: GeneratedBlogPost[] = ${JSON.stringify(unique, null, 2)};
`;

  fs.writeFileSync(OUT_FILE, ts, 'utf8');
  console.log(`Wrote ${unique.length} blog(s) to ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


