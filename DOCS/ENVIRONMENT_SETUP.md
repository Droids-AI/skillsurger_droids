# Environment Setup Guide

## Quick Fix for API Duplicate Path Issue

### Step 1: Create or Update `.env` File

Create a `.env` file in the project root with:

```env
# Production Backend API (IMPORTANT: Must include /api/v1)
VITE_BACKEND_API=https://api.wisedroids.ai/api/v1
```

### Step 2: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Verify the Fix

Open browser DevTools → Network tab and check:
- ✅ Should call: `https://api.wisedroids.ai/api/v1/openai/skillsurger`
- ❌ Should NOT call: `https://api.wisedroids.ai/api/v1/api/v1/openai/skillsurger`

## Complete Environment Configuration

### Production `.env`

```env
# Backend API - MUST include /api/v1 path
VITE_BACKEND_API=https://api.wisedroids.ai/api/v1

# Supabase
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Analytics (optional)
VITE_GA_MEASUREMENT_ID=your_measurement_id
```

### Local Development `.env`

```env
# Local Backend API
VITE_BACKEND_API=http://localhost:5002/api/v1

# Supabase (use same as production or local)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## How It Works

### Before (Wrong - Duplicate Path)

```
Base URL: https://api.wisedroids.ai
Endpoint: /api/v1/openai/skillsurger
Result:   https://api.wisedroids.ai/api/v1/openai/skillsurger ❌ Missing /api/v1

OR

Base URL: https://api.wisedroids.ai/api/v1
Endpoint: /api/v1/openai/skillsurger
Result:   https://api.wisedroids.ai/api/v1/api/v1/openai/skillsurger ❌ Duplicate!
```

### After (Correct)

```
Base URL: https://api.wisedroids.ai/api/v1  ← Includes /api/v1
Endpoint: /openai/skillsurger               ← No /api/v1 prefix
Result:   https://api.wisedroids.ai/api/v1/openai/skillsurger ✅ Perfect!
```

## API Endpoints Now Working

All these endpoints are fixed:

### 1. CV Scoring
```typescript
backendApi.scoreCVText(cvText);
// Calls: POST https://api.wisedroids.ai/api/v1/openai/skillsurger
// Type: scoreCVText
```

### 2. CV Enhancement
```typescript
backendApi.enhanceCVText(cvText, targetRole);
// Calls: POST https://api.wisedroids.ai/api/v1/openai/skillsurger
// Type: enhanceCVText
```

### 3. AI Mentorship
```typescript
backendApi.sendMessageToAIMentor(topic, message, history);
// Calls: POST https://api.wisedroids.ai/api/v1/openai/skillsurger
// Type: sendMessageToAIMentor
```

### 4. Mock Interviews
```typescript
backendApi.generateInterviewResponse(jobRole, userMessage, history);
// Calls: POST https://api.wisedroids.ai/api/v1/openai/skillsurger
// Type: generateInterviewResponse

backendApi.endInterview(jobRole, history, videoFrames);
// Calls: POST https://api.wisedroids.ai/api/v1/openai/skillsurger
// Type: endInterview
```

## Testing Steps

### 1. Test CV Scoring
1. Go to Dashboard → CV Scoring
2. Upload a CV
3. Click "Score CV"
4. Open DevTools → Network tab
5. Verify URL: `https://api.wisedroids.ai/api/v1/openai/skillsurger` ✅

### 2. Test Mock Interview
1. Go to Dashboard → Mentorship
2. If no jobs: Click "Explore Careers & Save Jobs"
3. Save a job from Career Explorer
4. Return to Mentorship → Schedule Interview
5. Start interview and send message
6. Check Network tab for correct URL ✅

### 3. Test AI Mentor
1. Go to Dashboard → Mentorship → AI Mentor
2. Start a new session
3. Send a message
4. Verify Network request URL ✅

## Troubleshooting

### Still seeing duplicate /api/v1/?

1. **Check `.env` file**: Make sure it has `/api/v1` at the end
2. **Restart dev server**: Environment changes require restart
3. **Clear browser cache**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
4. **Check console**: Look for the actual URL being called

### Environment variable not loading?

```bash
# Verify environment variables are loaded
npm run dev

# You should see the API URL in logs
# If not, check your .env file location (must be in project root)
```

### Local development not working?

Make sure your local backend is running on port 5002:
```bash
# Start backend server
cd backend
npm start
# or
python server.py

# Should see: Server running on http://localhost:5002
```

Then use:
```env
VITE_BACKEND_API=http://localhost:5002/api/v1
```

## Deployment

### Netlify / Vercel

Add environment variable in deployment settings:
```
VITE_BACKEND_API = https://api.wisedroids.ai/api/v1
```

### Docker

```dockerfile
ENV VITE_BACKEND_API=https://api.wisedroids.ai/api/v1
```

### Manual Build

```bash
# Set environment before build
export VITE_BACKEND_API=https://api.wisedroids.ai/api/v1
npm run build
```

## Summary

✅ **Base URL**: Must include `/api/v1`
✅ **Endpoints**: Do NOT include `/api/v1/` prefix
✅ **Result**: Clean, non-duplicate URLs
✅ **All features**: CV Scoring, Mock Interviews, AI Mentor all work

**Key Rule**: The `/api/v1` path goes in the environment variable, NOT in the code!

