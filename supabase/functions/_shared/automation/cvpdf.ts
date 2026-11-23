// Same text PDF as automation/tasks/skillsurger-test-board.ts (kept in sync), for the browser agent's CV upload.
export function textPdf(paragraphs: string[]): Uint8Array {
  const clean = (s: string) => s.replace(/[^\x20-\x7e]/g, (c) => ({ '–': '-', '—': '-', '’': "'", '‘': "'", '“': '"', '”': '"', '•': '-' } as Record<string, string>)[c] ?? '?');
  const lines: string[] = [];
  for (const p of paragraphs) {
    const words = clean(String(p)).split(/\s+/).filter(Boolean);
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > 90) { lines.push(line); line = w; } else line = (line + ' ' + w).trim();
    }
    if (line) lines.push(line);
    lines.push('');
  }
  const perPage = 56;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
  if (!pages.length) pages.push(['']);
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const objects: string[] = [];
  const pageIds = pages.map((_, i) => 4 + i * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  pages.forEach((pageLines, i) => {
    const stream = `BT /F1 10 Tf 13 TL 50 800 Td ${pageLines.map((l) => `(${esc(l)}) '`).join(' ')} ET`;
    objects[pageIds[i]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageIds[i] + 1} 0 R >>`;
    objects[pageIds[i] + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) { offsets[id] = out.length; out += `${id} 0 obj\n${objects[id]}\nendobj\n`; }
  const xref = out.length;
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n` + offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

export function cvParagraphs(cv: any, answers: Record<string, string>): string[] {
  return [answers.full_name, [answers.email, answers.phone, answers.location].filter(Boolean).join(' | '), cv?.headline, cv?.summary?.text,
    ...((cv?.sections || []) as any[]).flatMap((s) => [String(s.heading || '').toUpperCase(), ...((s.items || []) as any[]).map((i) => '- ' + i.text)])]
    .filter((v) => typeof v === 'string' && v.trim()).map((v) => v.slice(0, 5000));
}
