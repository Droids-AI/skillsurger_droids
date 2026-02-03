# Gemini AI Video Analysis for Mock Interviews

## Overview

This feature enhances the AI-powered mock interview system with live video analysis using Google's Gemini AI. The system now captures video frames during interviews and provides comprehensive feedback on both verbal responses (using GPT-5.1) and non-verbal communication (using Gemini AI).

## Key Features

### 1. **Live Video Capture**
- Real-time video recording during mock interviews
- Automatic frame capture every 10 seconds (configurable)
- Privacy-focused: No permanent video storage
- Works with standard webcam/camera devices

### 2. **AI-Powered Video Analysis (Gemini 1.5 Pro)**
Analyzes the following aspects:

#### Body Language & Posture (Score: 0-10)
- Sitting posture and professional demeanor
- Hand gestures and their effectiveness
- Overall body language confidence

#### Eye Contact & Engagement (Score: 0-10)
- Consistency of eye contact with camera
- Level of engagement and attentiveness
- Facial expressions and emotional intelligence

#### Professional Appearance (Score: 0-10)
- Dress code appropriateness
- Background setting professionalism
- Overall presentation

#### Energy & Enthusiasm (Score: 0-10)
- Facial expressions showing interest
- Animated vs monotone presentation
- Genuine enthusiasm for the role

### 3. **Comprehensive Feedback**
- **Conversation Analysis**: GPT-5.1 analyzes verbal responses
- **Video Analysis**: Gemini AI evaluates non-verbal communication
- **Combined Score**: Weighted average (60% verbal, 40% visual)
- **Detailed Recommendations**: Specific, actionable feedback

## Technical Architecture

### Backend Components

#### 1. **Gemini Service** (`app/services/gemini.service.js`)
```javascript
// Main functions:
- analyzeInterviewVideo(videoFrames, jobRole, conversation)
- generateComprehensiveFeedback(jobRole, conversationHistory, videoAnalysis)
```

**Key Features:**
- Uses Gemini 1.5 Pro for detailed multimodal analysis
- Processes up to 5 sampled frames per interview
- Returns structured JSON feedback

#### 2. **Updated OpenAI Service** (`app/services/openai.service.js`)
```javascript
exports.endInterview = async (jobRole, conversationHistory, videoFrames)
```

**Integration:**
- Combines GPT-5.1 conversation analysis
- Integrates Gemini video analysis
- Merges feedback into unified result

#### 3. **API Endpoint** (`app/controllers/openai.controller.js`)
```javascript
// Endpoint: POST /api/v1/openai/skillsurger
// Type: "endInterview"
// Payload: { jobRole, conversationHistory, videoFrames }
```

### Frontend Components

#### 1. **VideoCapture Component** (`src/components/VideoCapture.tsx`)

**Features:**
- Real-time video preview
- Automatic frame capture during recording
- Privacy notification
- Camera permission handling
- Visual recording indicator

**Props:**
```typescript
{
  isRecording: boolean;
  onFrameCapture?: (frameData: string) => void;
  captureInterval?: number; // Default: 5000ms
}
```

**Usage:**
```tsx
<VideoCapture 
  isRecording={isInterviewing}
  captureInterval={10000} // 10 seconds
/>
```

#### 2. **MentorshipHub Integration** (`src/components/MentorshipHub.tsx`)

**Updated Features:**
- Video capture during interviews
- Frame collection on interview end
- Enhanced feedback display
- Video analysis scores visualization

#### 3. **API Integration** (`src/lib/backendApi.ts`, `src/lib/mentorship.ts`)

**Updated Methods:**
```typescript
endInterview(jobRole, conversationHistory, videoFrames?)
```

## Data Flow

```
1. User starts mock interview
   ↓
2. VideoCapture component activates camera
   ↓
3. Frames captured every 10 seconds during interview
   ↓
4. User clicks "End Interview"
   ↓
5. Frontend collects all captured frames
   ↓
6. Sends to backend: { jobRole, conversation, videoFrames }
   ↓
7. Backend processes:
   - GPT-5.1: Analyzes conversation
   - Gemini AI: Analyzes video frames
   ↓
8. Combined feedback returned to frontend
   ↓
9. Display comprehensive results with video analysis
```

## Setup Instructions

### 1. **Environment Configuration** ✅

Your `GEMINI_AI_STUDIO_KEY` is already configured in the backend `.env` file!

The system will automatically use the existing Gemini API key from your environment variables.

### 2. **Install Dependencies**

Backend:
```bash
cd Intervue-Backend
npm install @google/generative-ai
```

### 3. **Database Schema Update**

Ensure the `mock_interviews` table includes:
```sql
ALTER TABLE mock_interviews 
ADD COLUMN video_analysis JSONB;
```

This stores video analysis results:
```json
{
  "bodyLanguageScore": 8,
  "eyeContactScore": 7,
  "professionalAppearanceScore": 9,
  "energyScore": 6,
  "overallVideoScore": 7.5
}
```

### 4. **Browser Permissions**

Users must grant camera permissions when prompted. The app includes:
- Clear permission request messaging
- Error handling for denied permissions
- Privacy assurance notifications

## Usage Guide

### For Users

1. **Start Mock Interview**
   - Navigate to Mentorship Hub → Mock Interviews
   - Select a scheduled interview and click "Start Interview"

2. **Enable Camera**
   - Click "Turn On Camera" button
   - Grant camera permissions when prompted
   - Verify video preview is working

3. **Conduct Interview**
   - Answer interviewer questions naturally
   - Maintain good posture and eye contact with camera
   - The system captures frames automatically (indicated by recording badge)

4. **End Interview**
   - Click "End Interview" button
   - System analyzes both conversation and video
   - Comprehensive feedback is displayed

5. **Review Feedback**
   - View overall scores (Technical, Communication, Overall)
   - Check video analysis scores (Body Language, Eye Contact, etc.)
   - Read detailed strengths and improvements
   - Follow recommendations for future interviews

### For Developers

#### Customizing Frame Capture Interval

In `MentorshipHub.tsx`:
```tsx
<VideoCapture 
  isRecording={isInterviewing}
  captureInterval={5000} // Capture every 5 seconds
/>
```

#### Customizing Analysis Prompts

Edit `gemini.service.js` → `analyzeInterviewVideo()` function to adjust:
- Scoring criteria
- Feedback categories
- Analysis depth
- Output format

#### Adjusting Frame Sampling

In `gemini.service.js`:
```javascript
// Sample every Nth frame (currently 5 frames max)
const sampleRate = Math.ceil(videoFrames.length / 5);
```

Increase/decrease the divisor (5) to change number of frames analyzed.

## Privacy & Security

### Privacy Measures
- ✅ Video frames are **not** permanently stored
- ✅ Frames are used only for AI analysis
- ✅ Clear privacy notification displayed to users
- ✅ Users have full control over camera on/off

### Security Best Practices
- ✅ All API calls go through backend (no client-side AI calls)
- ✅ Gemini API key stored securely in environment variables
- ✅ Video data transmitted via secure HTTPS
- ✅ No video recordings saved to disk

## Performance Considerations

### Frame Capture
- **Interval**: 10 seconds (balance between analysis quality and data size)
- **Resolution**: 1280x720 (ideal for analysis without excessive bandwidth)
- **Format**: JPEG with 80% compression
- **Storage**: Max 10 frames kept in memory (prevents memory bloat)

### API Optimization
- **Sampling**: Max 5 frames sent to Gemini (cost-effective)
- **Model**: Gemini 1.5 Pro (best balance of speed and accuracy)
- **Timeout**: Reasonable timeout for video analysis

### Estimated Costs
- **GPT-5.1**: ~$0.02-0.05 per interview (conversation analysis)
- **Gemini 1.5 Pro**: ~$0.01-0.03 per interview (5 images)
- **Total**: ~$0.03-0.08 per complete interview with video

## Troubleshooting

### Common Issues

#### 1. Camera Not Working
- **Check**: Browser permissions granted
- **Check**: Camera not in use by another app
- **Check**: HTTPS connection (required for camera access)

#### 2. No Video Analysis in Feedback
- **Check**: GEMINI_AI_STUDIO_KEY is set in config.env
- **Check**: Backend logs for Gemini API errors
- **Check**: Frames were captured (console logs)

#### 3. Poor Video Analysis Quality
- **Improve**: Lighting conditions
- **Improve**: Camera positioning (face clearly visible)
- **Improve**: Stable internet connection

## Future Enhancements

### Planned Features
- [ ] Real-time feedback during interview (subtle hints)
- [ ] Emotion detection and analysis
- [ ] Speaking pace and clarity analysis
- [ ] Multiple camera angles support
- [ ] Interview recording playback
- [ ] Comparative analysis across multiple interviews
- [ ] Practice mode with instant feedback

## API Reference

### Backend Endpoints

#### End Interview with Video Analysis
```
POST /api/v1/openai/skillsurger
Content-Type: application/json

{
  "type": "endInterview",
  "jobRole": "Software Engineer at Google",
  "conversationHistory": [
    { "role": "interviewer", "content": "Tell me about yourself" },
    { "role": "user", "content": "I am a software engineer..." }
  ],
  "videoFrames": ["base64_frame_1", "base64_frame_2", ...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback": "Overall feedback text...",
    "technicalScore": 4,
    "communicationScore": 4,
    "overallScore": 4,
    "detailedFeedback": {
      "strengths": ["Clear communication", "Good technical depth"],
      "improvements": ["Provide more specific examples"],
      "recommendations": ["Practice STAR method"],
      "videoStrengths": ["Maintained eye contact", "Professional appearance"],
      "videoImprovements": ["Improve posture", "Show more enthusiasm"]
    },
    "videoAnalysis": {
      "bodyLanguageScore": 8,
      "eyeContactScore": 7,
      "professionalAppearanceScore": 9,
      "energyScore": 6,
      "overallVideoScore": 7.5
    }
  }
}
```

## Support & Resources

- **Gemini API Docs**: https://ai.google.dev/gemini-api/docs
- **OpenAI GPT-5.1 Docs**: https://platform.openai.com/docs
- **MediaDevices API**: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices

## Changelog

### v1.0.0 (Current)
- ✅ Initial implementation with Gemini 1.5 Pro
- ✅ Video capture component
- ✅ Comprehensive feedback display
- ✅ Privacy and security measures
- ✅ Integration with existing interview flow

---

**Note**: This feature requires both a valid Gemini API key and OpenAI API key. Ensure both are configured in the backend environment variables before use.

