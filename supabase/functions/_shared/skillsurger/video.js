// Same optional video-analysis response as the former Gemini adapter. Frames
// go directly to the model; they are not stored in Edge Function logs or tables.
export async function analyzeInterviewVideo(frames, jobRole, conversation) {
  const stride = Math.max(1, Math.ceil(frames.length / 5));
  const sampled = frames.filter((_, i) => i % stride === 0).slice(0, 5);
  if (!sampled.length) return null;
  const content = [{ type: 'text', text: `Review these interview frames for ${jobRole}. Evaluate visible presentation only, not personality, health or protected attributes. Do not infer eye contact with an interviewer from a still image. If no candidate is visible or the frames cannot support analysis, return {"unavailable":true}. Otherwise return JSON with bodyLanguageScore, eyeContactScore, professionalAppearanceScore, energyScore, overallVideoScore (integers 0-10), videoFeedback:{strengths:string[],improvements:string[],specificObservations:string[]}, recommendations:string[]. Use cautious observations. Conversation context: ${JSON.stringify(conversation.slice(-10))}` }, ...sampled.map(frame => ({ type: 'image_url', image_url: { url: frame.startsWith('data:image/') ? frame : `data:image/jpeg;base64,${frame}` } }))];
  const { openai, SKILLSURGER_AI_MODEL } = await import('./openai.js');
  try {
    const result = await openai.chat.completions.create({ model: SKILLSURGER_AI_MODEL, messages: [{ role: 'user', content }], response_format: { type: 'json_object' }, max_completion_tokens: 1400 });
    const value = JSON.parse(result.choices[0]?.message?.content || '{}');
    const keys = ['bodyLanguageScore', 'eyeContactScore', 'professionalAppearanceScore', 'energyScore', 'overallVideoScore'];
    return !value.unavailable && keys.every(key => Number.isInteger(value[key]) && value[key] >= 0 && value[key] <= 10) && value.videoFeedback && Array.isArray(value.recommendations) ? value : null;
  } catch { console.warn(JSON.stringify({ area: 'skillsurger-video', code: 'analysis_unavailable' })); return null; }
}
