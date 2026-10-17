// Produce real HTML metadata/content for social crawlers that do not run JS.
const fs=require('node:fs');
const path=require('node:path');
const {buildSync}=require('esbuild');
fs.mkdirSync('artifacts',{recursive:true});
const output=path.resolve('artifacts/fde-render.cjs');
buildSync({stdin:{contents:`import React from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import FDECourse from './src/pages/FDECourse';
export function render() {
 const context = {};
 const body = renderToString(<HelmetProvider context={context}><FDECourse /></HelmetProvider>);
 const head = context.helmet;
 return { body, head: head.title.toString() + head.meta.toString() + head.link.toString() + head.script.toString() };
}`,resolveDir:process.cwd(),loader:'jsx'},outfile:output,bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom/server','react-helmet-async','lucide-react'],logLevel:'silent'});
const rendered=require(output).render();
let html=fs.readFileSync('dist/index.html','utf8');
html=html.replace(/<title>[\s\S]*?<\/title>/g,'').replace(/<meta\b[^>]*data-rh="true"[^>]*>/g,'').replace(/<link\b[^>]*data-rh="true"[^>]*>/g,'');
// Homepage JSON-LD must not describe the course route.
html=html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'');
html=html.replace('</head>',rendered.head+'\n</head>').replace('<div id="root"></div>','<div id="root">'+rendered.body+'</div>');
fs.mkdirSync('dist/courses/forward-deployed-ai-engineer',{recursive:true});
fs.writeFileSync('dist/courses/forward-deployed-ai-engineer/index.html',html);
console.log('Generated FDE static HTML with route-specific SEO/OG and complete curriculum.');
