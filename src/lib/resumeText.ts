import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export async function extractResumeText(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let text = '';
  try {
    if (extension === 'pdf') {
      const task = getDocument({ data: await file.arrayBuffer() });
      const pdf = await task.promise;
      try {
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const content = await (await pdf.getPage(i)).getTextContent();
          pages.push(content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join(''));
        }
        text = pages.join('\n');
      } finally { await task.destroy(); }
    } else if (extension === 'docx') {
      const mammoth = await import('mammoth/mammoth.browser');
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      text = result.value;
    } else if (extension === 'txt') {
      text = await file.text();
    } else {
      throw new Error('Please save your resume as PDF, DOCX or TXT. Legacy DOC files are not supported.');
    }
  } catch (error) {
    if (extension === 'doc') throw error;
    throw new Error('Could not read this resume. Check that the file is a valid PDF, DOCX or TXT and try again.');
  }
  if (!text.trim()) throw new Error('No readable text found. For a scanned PDF, use OCR or upload a DOCX with selectable text.');
  return text.trim();
}

const skills = ['JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'REST APIs', 'GraphQL', 'HTML', 'CSS', 'Tailwind', 'Leadership', 'Communication', 'Project Management', 'Agile', 'Scrum', 'Data Analysis', 'Machine Learning', 'AI', 'DevOps', 'CI/CD', 'Testing', 'Problem Solving', 'Team Collaboration', 'Critical Thinking'];
export function detectResumeSkills(text: string): string[] {
  return skills.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keyword = skill === 'REST APIs' ? 'REST\\s+APIs?' : escaped;
    return new RegExp(`(?:^|[^a-z0-9])${keyword}(?=$|[^a-z0-9])`, 'i').test(text);
  });
}
