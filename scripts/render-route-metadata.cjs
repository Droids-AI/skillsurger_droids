// Generate crawlable route metadata from the same SEO props used by React.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { buildSync } = require('esbuild');
const { renderToStaticMarkup } = require('react-dom/server');
const React = require('react');
const { HelmetProvider } = require('react-helmet-async');

const bundle = path.resolve('artifacts/route-metadata.cjs');
fs.mkdirSync('artifacts', { recursive: true });
buildSync({ stdin: { contents: "export { default as SEO } from './src/components/SEO'; export { seoLandingPages } from './src/lib/constants/seoLandingPages'; export { generatedBlogs } from './src/content/blogs.generated';", resolveDir: process.cwd(), loader: 'ts' }, outfile: bundle, bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'react-helmet-async'], logLevel: 'silent' });
const { SEO, seoLandingPages, generatedBlogs } = require(bundle);
const routes = new Map();
function value(node) {
  if (!node) return true;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isJsxExpression(node)) return value(node.expression);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  return undefined;
}
for (const file of fs.readdirSync('src/pages').filter(file => file.endsWith('.tsx') && !file.includes('backup'))) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join('src/pages', file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(source) === 'SEO') {
      const props = {};
      for (const attribute of node.attributes.properties) {
        if (ts.isJsxAttribute(attribute)) {
          const parsed = value(attribute.initializer);
          if (parsed !== undefined) props[attribute.name.text] = parsed;
        }
      }
      if (typeof props.canonicalUrl === 'string' && props.title && props.description) routes.set(props.canonicalUrl, props);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
for (const page of seoLandingPages) routes.set('/' + page.slug, { title: page.metaTitle, description: page.metaDescription, keywords: page.keywords, canonicalUrl: '/' + page.slug });
for (const post of generatedBlogs) routes.set('/blog/' + post.slug, { title: post.title + ' | Skillsurger Blog', description: post.excerpt, canonicalUrl: '/blog/' + post.slug, ogImage: post.image });
for (const route of ['/forgot-password', '/reset-password']) routes.set(route, { title: 'Reset password | Skillsurger', description: 'Recover access to your Skillsurger account.', canonicalUrl: route, noIndex: true });
routes.set('/thank-you', { title: 'Request received | Skillsurger', description: 'Your request has been received. View your next steps.', canonicalUrl: '/thank-you', noIndex: true });
// The FDE renderer generates both its metadata and full curriculum; preserve that artifact.
routes.delete('/courses/forward-deployed-ai-engineer');
const template = fs.readFileSync('dist/index.html', 'utf8');
const clean = template.replace(/<title>[\s\S]*?<\/title>/g, '').replace(/<meta\b[^>]*data-rh="true"[^>]*>/g, '').replace(/<link\b[^>]*data-rh="true"[^>]*>/g, '').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
for (const [route, props] of routes) {
  const context = {};
  renderToStaticMarkup(React.createElement(HelmetProvider, { context }, React.createElement(SEO, props)));
  const head = context.helmet;
  const metadata = head.title.toString() + head.meta.toString() + head.link.toString();
  const filename = route === '/' ? 'dist/index.html' : path.join('dist', route.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, clean.replace('</head>', metadata + '\n</head>'));
}
fs.writeFileSync('artifacts/route-metadata-manifest.json', JSON.stringify([...routes.keys()], null, 2));
console.log(`Generated route-specific title, description, OG and Twitter metadata for ${routes.size} routes.`);
