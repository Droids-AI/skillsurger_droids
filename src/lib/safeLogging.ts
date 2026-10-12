// Only controlled context belongs here: never pass provider bodies or document text.
export function reportError(area: string, code: string, requestId = crypto.randomUUID()) {
  console.error(JSON.stringify({ level: 'error', area, code, requestId, at: new Date().toISOString() }));
  return requestId;
}
