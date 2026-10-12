// Skillsurger-only backend helper; no AI-generated facts are written to a CV.
export function formatFactualCV(source: string) {
  if (typeof source !== 'string' || !source.trim() || source.length > 100000) throw new Error('Provide a readable resume under 100,000 characters.');
  const enhancedCV = source.replace(/\r\n/g, '\n').split('\n').map(line => line.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return {
    enhancedCV,
    // Formatting does not provide trustworthy structured profile updates.
    parsedData: {},
    canApplyToProfile: false,
    changesSummary: [
      'Cleaned spacing while preserving your supplied statements and their order.',
      'What verified outcomes or metrics can you add to your experience? Add them to your source resume before tailoring.',
      'Which projects and tools did you actually use? Include only details you can substantiate.',
    ],
    keyImprovements: {
      atsOptimization: 'Clean text spacing; no inferred keywords added',
      contentStrength: 'All supplied facts preserved; missing evidence must come from you',
      formattingChanges: 'Whitespace cleanup only',
    },
  };
}
