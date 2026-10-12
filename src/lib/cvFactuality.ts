// Conservative until the generation backend supports fact citations. Formatting
// may change; supplied statements and their order must remain identical.
function normalize(text: string): string {
  return text.replace(/^[ \t]*[>#*-]+[ \t]*/gm, '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function assertFactPreservingCV(source: string, result: { enhancedCV: string; parsedData: unknown }, existingProjects: unknown[] = []) {
  if (!source.trim() || typeof result?.enhancedCV !== 'string' || normalize(result.enhancedCV) !== normalize(source)) {
    throw new Error('The suggested CV changed facts from your resume, so it was not applied. Add verified achievements and metrics to your source resume, then try again.');
  }
  const facts = normalize(source + '\n' + JSON.stringify(existingProjects));
  function check(value: unknown): void {
    if (typeof value === 'string' && value.trim() && !facts.includes(normalize(value))) {
      throw new Error('The suggested profile contained details that could not be verified against your resume. Nothing was applied.');
    }
    if (typeof value === 'number' && (!Number.isFinite(value) || !new RegExp(`(?:^|[^0-9])${value}(?:$|[^0-9])`).test(facts))) {
      throw new Error('An unverified number was detected. Add the correct metric to your resume before enhancing it.');
    }
    if (Array.isArray(value)) value.forEach(check);
    else if (value && typeof value === 'object') Object.values(value).forEach(check);
  }
  check(result.parsedData);
}

export const CV_FACT_POLICY = {
  mode: 'formatting_only',
  instructions: 'Preserve every supplied statement and its order. Change only whitespace and markdown formatting. Do not invent or infer metrics, projects, tools, achievements, employers, dates, locations or experience. Parsed fields must use exact source phrases. Ask for missing metrics in changesSummary, never insert placeholders into the CV.',
};
