# Backend API URL Fix

## Issue Fixed

Fixed duplicate `/api/v1/` path in backend API calls that was causing requests to fail with:
```
https://api.wisedroids.ai/api/v1/api/v1/openai/skillsurger
```

Now correctly resolves to:
```
https://api.wisedroids.ai/api/v1/openai/skillsurger
```

## Changes Made

### 1. Fixed API Endpoint Construction
**File**: `src/lib/backendApi.ts`

**Before:**
```typescript
// Base URL without /api/v1
const BACKEND_BASE_URL = 'https://api.wisedroids.ai';

// Endpoints with /api/v1/
async scoreCVText(cvText: string) {
  return this.makeRequest('/api/v1/openai/skillsurger', {...}, 'scoreCVText');
  // Result: https://api.wisedroids.ai/api/v1/openai/skillsurger ❌ (missing /api/v1 in base)
  // OR if base had /api/v1: https://api.wisedroids.ai/api/v1/api/v1/openai/skillsurger ❌ (duplicate)
}
```

**After:**
```typescript
// Base URL WITH /api/v1
const BACKEND_BASE_URL = 'https://api.wisedroids.ai/api/v1';

// Endpoints WITHOUT /api/v1/
async scoreCVText(cvText: string) {
  return this.makeRequest('/openai/skillsurger', {...}, 'scoreCVText');
  // Result: https://api.wisedroids.ai/api/v1/openai/skillsurger ✅ (correct)
}
```

### 2. Added Career Explorer Button in Mock Interviews
**File**: `src/components/MentorshipHub.tsx`

**Added:**
- Visual alert when no saved jobs are available
- "Explore Careers & Save Jobs" button that navigates to Career Explorer
- Better UX for users who haven't saved any jobs yet

**Before:**
- Empty dropdown with no guidance
- Users couldn't schedule interviews without jobs

**After:**
- Helpful message explaining why jobs are needed
- Quick navigation to Career Explorer
- Clear call-to-action to save jobs first

## Environment Variables

Make sure your `.env` file has the correct backend URL **including /api/v1**:

```env
# Development (local)
VITE_BACKEND_API=http://localhost:5002/api/v1

# Production
VITE_BACKEND_API=https://api.wisedroids.ai/api/v1
```

**Important**: The base URL must include `/api/v1` path. The endpoint paths in the code no longer include this prefix to avoid duplication.

## API Endpoints Working

All these endpoints now work correctly:

### CV Scoring
```typescript
backendApi.scoreCVText(cvText);
// POST: https://api.wisedroids.ai/api/v1/openai/skillsurger
// Type: scoreCVText
```

### CV Enhancement
```typescript
backendApi.enhanceCVText(cvText, targetRole);
// POST: https://api.wisedroids.ai/api/v1/openai/skillsurger
// Type: enhanceCVText
```

### AI Mentorship
```typescript
backendApi.sendMessageToAIMentor(topic, message, history);
// POST: https://api.wisedroids.ai/api/v1/openai/skillsurger
// Type: sendMessageToAIMentor
```

### Mock Interviews
```typescript
backendApi.generateInterviewResponse(jobRole, userMessage, history);
// POST: https://api.wisedroids.ai/api/v1/openai/skillsurger
// Type: generateInterviewResponse

backendApi.endInterview(jobRole, history, videoFrames);
// POST: https://api.wisedroids.ai/api/v1/openai/skillsurger
// Type: endInterview
```

## Testing

1. **CV Scoring**: Upload a CV and click "Score CV"
2. **CV Enhancement**: After scoring, click "Enhance CV"
3. **Mock Interview**: Go to Mentorship Hub → Mock Interviews
4. **AI Mentor**: Go to Mentorship Hub → AI Mentor

All should now work without 404 errors.

## Career Explorer Button

In Mock Interviews tab, if you have no saved jobs:

1. **Message displayed**: "No Saved Jobs Found"
2. **Action button**: "Explore Careers & Save Jobs"
3. **Behavior**: Redirects to Career Explorer (/dashboard?section=career)

Once you save jobs from Career Explorer, they will appear in the dropdown.

## Related Documentation

- [API 404 Fix](./API_404_FIX.md) - Previous API fixes
- [CV Scoring Feature](./CV_SCORING_FEATURE.md) - CV scoring implementation
- [Security Checklist](./SECURITY_CHECKLIST.md) - Security guidelines

