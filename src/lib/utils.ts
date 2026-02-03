import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractJsonFromMarkdown(content: string): string {
  // Remove markdown code block delimiters
  const cleanedContent = content
    .replace(/^```json\s*/i, '') // Remove opening ```json
    .replace(/^```\s*/i, '') // Remove opening ```
    .replace(/\s*```$/i, '') // Remove closing ```
    .trim();
  
  return cleanedContent;
}

export function cleanTruncatedDescription(desc: string): string {
  const lines = desc.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length < 2) return desc;
  const lastLine = lines[lines.length - 1];
  // If last line ends with a period and is much shorter than the previous line, remove it
  if (
    lastLine.endsWith('.') &&
    lastLine.length < 60 &&
    lines[lines.length - 2].length > 80
  ) {
    return lines.slice(0, -1).join('\n');
  }
  return desc;
}