# CV Scoring & Enhancement Feature 🎯

## Overview

A powerful AI-driven CV scoring and enhancement system that uses **GPT-5.1** to analyze, score, and automatically improve resumes with a single click.

## Features

### 1. CV Upload

- Upload CV as `.txt` or `.pdf` file
- Automatic text extraction from PDFs
- Or paste CV text directly
- Live text preview with character count
- Optional target role specification for tailored enhancement

### 2. AI-Powered Scoring (GPT-5.1)

Comprehensive CV analysis across 5 key dimensions:

- **ATS Optimization** (0-100) - How well it passes Applicant Tracking Systems
- **Content Quality** (0-100) - Quality of information and achievements
- **Formatting** (0-100) - Structure and professional appearance
- **Keyword Relevance** (0-100) - Industry-specific keywords
- **Impact** (0-100) - Strength of language and quantifiable results

**Overall Score**: Weighted average of all dimensions

### 3. Detailed Feedback

- ✅ **Strengths**: What's working well in the CV
- ❌ **Weaknesses**: Areas that need improvement
- 💡 **Recommendations**: Actionable steps to improve
- 📋 **Missing Elements**: Important sections not included

### 4. Automatic Enhancement

One-click enhancement that:

- Improves content while keeping information accurate
- Optimizes for ATS systems
- Uses strong action verbs
- Adds quantifiable achievements
- Improves formatting and structure
- Naturally integrates relevant keywords
- Makes CV more professional and impactful

### 5. Re-scoring

After enhancement, the system automatically:

- Scores the enhanced CV
- Shows score improvements
- Displays changes made
- Allows download of enhanced CV

## User Flow

```
1. Upload CV (.txt or .pdf) or Paste Text
   ↓
2. (Optional) Enter Target Role
   ↓
3. Click "Score CV"
   ↓
4. **SCORE CARD APPEARS AT TOP** (Full Width)
   ├─ Large Overall Score Circle
   ├─ 5 Dimension Progress Bars
   ├─ Strengths (Green Box)
   ├─ Weaknesses (Red Box)
   └─ Recommendations (Blue Box)
   ↓
5. Click "Enhance CV" (Upload section still visible below)
   ↓
6. AI Processes & Enhances (5-10 seconds)
   ↓
7. **SCORE CARD UPDATES AT TOP** + Enhanced Section Below
   ├─ New Higher Scores (Animated)
   ├─ "Enhanced" Badge
   ├─ Changes Summary
   ├─ Enhanced CV Text Preview
   └─ Download Button
```

## Technical Implementation

### Backend API (GPT-5.1)

#### 1. Score CV API

**Endpoint**: `POST /api/v1/openai/skillsurger`
**Type**: `scoreCVText`

**Request**:

```json
{
  "text": "CV content here...",
  "type": "scoreCVText"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "overallScore": 75,
    "scores": {
      "atsOptimization": 70,
      "contentQuality": 80,
      "formatting": 75,
      "keywordRelevance": 72,
      "impact": 78
    },
    "strengths": [
      "Clear career progression shown",
      "Quantifiable achievements included",
      "Good use of technical keywords"
    ],
    "weaknesses": [
      "Missing professional summary",
      "Inconsistent formatting",
      "Limited action verbs"
    ],
    "recommendations": [
      "Add a compelling professional summary",
      "Standardize bullet point formatting",
      "Use stronger action verbs (e.g., 'Spearheaded', 'Orchestrated')"
    ],
    "missingElements": ["Skills section", "Certifications"]
  }
}
```

#### 2. Enhance CV API

**Endpoint**: `POST /api/v1/openai/skillsurger`
**Type**: `enhanceCVText`

**Request**:

```json
{
  "text": "CV content here...",
  "targetRole": "Software Engineer",
  "type": "enhanceCVText"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "enhancedCV": "Enhanced CV text with improvements...",
    "changesSummary": [
      "Added professional summary with key strengths",
      "Improved action verbs across all experiences",
      "Optimized for ATS keywords",
      "Quantified achievements with metrics",
      "Improved formatting consistency"
    ],
    "keyImprovements": {
      "atsOptimization": "Added relevant industry keywords naturally throughout",
      "contentStrength": "Enhanced action verbs and added quantifiable metrics",
      "formattingChanges": "Standardized bullet points and section headers"
    }
  }
}
```

### Frontend Components

#### CVScoring Component

**Location**: `src/components/CVScoring.tsx`

**Features**:

- File upload handler (.txt and .pdf files)
- Automatic PDF text extraction using pdf.js
- Large text area for direct input/preview
- Character counter
- Target role input (optional)
- Score CV button with loading state
- Enhance CV button with loading state
- Real-time score visualization
- Progress bars for each dimension
- Color-coded scores (red/yellow/green)
- Enhanced CV preview
- Download enhanced CV as .txt
- **Full-width layout** for better visibility

**State Management**:

```typescript
- cvText: string - Current CV content
- targetRole: string - Optional target role
- loading: boolean - Scoring in progress
- enhancing: boolean - Enhancement in progress
- score: CVScore | null - Current scores
- enhancedCV: CVEnhancement | null - Enhanced version
- error: string - Error messages
```

### Security & API Design

✅ **All AI processing happens on backend** (GPT-5.1)
✅ **No API keys exposed to frontend**
✅ **Backend validation and error handling**
✅ **Subscription check before API calls**

## UI/UX Design

### Layout (Full Width Stacked - Score at Top)

```
┌───────────────────────────────────────────────────────────────────┐
│  AI CV Scoring & Enhancement                                      │
├───────────────────────────────────────────────────────────────────┤
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║ 1. CV SCORE CARD (Top - Full Width - Prominent)           ║  │
│  ║ ┌────────────────┬──────────────────────────────────────┐ ║  │
│  ║ │ Overall Score  │  5 Dimension Progress Bars          │ ║  │
│  ║ │   [85/100]     │  • ATS Optimization      [82/100]   │ ║  │
│  ║ │ (Large Circle) │  • Content Quality       [88/100]   │ ║  │
│  ║ │   Enhanced✨   │  • Formatting           [85/100]   │ ║  │
│  ║ │                │  • Keyword Relevance     [80/100]   │ ║  │
│  ║ │                │  • Impact               [90/100]   │ ║  │
│  ║ └────────────────┴──────────────────────────────────────┘ ║  │
│  ║ ┌───────────────┬───────────────┬──────────────────────┐ ║  │
│  ║ │ Strengths ✓   │ Weaknesses •  │ Recommendations →    │ ║  │
│  ║ │ Green Box     │ Red Box       │ Blue Box             │ ║  │
│  ║ │ 3 items       │ 3 items       │ 3 items              │ ║  │
│  ║ └───────────────┴───────────────┴──────────────────────┘ ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
├───────────────────────────────────────────────────────────────────┤
│  2. UPLOAD & ANALYZE SECTION (Full Width)                        │
│  ┌─────────────┬────────────────────────────────────────────┐   │
│  │ Left Col    │  Right Col (Larger - 2/3 width)           │   │
│  │ • Upload    │  • CV Text Preview (15 rows)              │   │
│  │ • Target    │  • Character count                        │   │
│  │ • Score Btn │  • Editable text                         │   │
│  │ • Enhance   │  • Monospace font                        │   │
│  └─────────────┴────────────────────────────────────────────┘   │
├───────────────────────────────────────────────────────────────────┤
│  3. ENHANCED CV (Full Width - When Available)                    │
│  • Changes Summary (2-column grid with icons)                    │
│  • Enhanced CV Text Preview (scrollable)                         │
│  • Download Button (top-right)                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Key Layout Improvements

✅ **Score Card Always at Top** - Most important info visible first
✅ **Full Width Cards** - Better space utilization
✅ **Visual Hierarchy** - Score → Upload → Enhanced
✅ **Large Score Display** - 32px circle with border
✅ **Colored Feedback Boxes** - Green/Red/Blue backgrounds
✅ **Responsive Design** - Adapts to mobile/tablet

### Visual Indicators

**Score Circles**:

- 🟢 80-100: Green (Excellent)
- 🟡 60-79: Yellow (Good)
- 🔴 0-59: Red (Needs Improvement)

**Progress Bars**:

- Animated fill
- Color-coded by score
- Shows percentage

**Loading States**:

- "Scoring..." with spinner
- "Enhancing..." with spinner
- Disabled buttons during processing

## Integration Points

### Dashboard Integration

**Location**: `src/pages/DashboardPage.tsx`

**Menu Item**:

```typescript
{
  id: 'cv-scoring',
  label: 'CV Scoring',
  icon: FileCheck,
}
```

**Access Control**:

- Requires active subscription
- Uses `hasAIFeatureAccess()` check
- Shows upgrade prompt if no access

### Backend API Service

**Location**: `app/services/openai.service.js`

**New Functions**:

1. `exports.scoreCVText(cvText)` - Line ~880
2. `exports.enhanceCVText(cvText, targetRole)` - Line ~930

**Model**: GPT-5.1
**Max Tokens**:

- Scoring: 3000
- Enhancement: 4000

### Controller

**Location**: `app/controllers/openai.controller.js`

**New Handlers**:

```javascript
if (type === "scoreCVText") {
  const result = await OpenAIServices.scoreCVText(text);
  sendSuccessResponse(res, 200, true, result);
}

if (type === "enhanceCVText") {
  const { targetRole } = req.body;
  const result = await OpenAIServices.enhanceCVText(text, targetRole);
  sendSuccessResponse(res, 200, true, result);
}
```

## Testing

### Manual Testing Steps

1. **Upload CV**

   ```
   ✓ Upload .txt file
   ✓ Upload .pdf file (automatic text extraction)
   ✓ Paste CV text in large preview area
   ✓ Check character counter
   ✓ Add target role (optional)
   ```

2. **Score CV**

   ```
   ✓ Click "Score CV"
   ✓ Wait for loading (3-5 seconds)
   ✓ Verify scores appear
   ✓ Check all 5 dimensions
   ✓ Review strengths/weaknesses
   ```

3. **Enhance CV**

   ```
   ✓ Click "Enhance CV"
   ✓ Wait for enhancement (5-10 seconds)
   ✓ Verify new higher scores
   ✓ Review changes summary
   ✓ Check enhanced CV text
   ```

4. **Download**
   ```
   ✓ Click "Download" button
   ✓ Verify file downloads
   ✓ Open file and verify content
   ```

### Expected Score Improvements

Typical enhancement should improve:

- Overall Score: +10-25 points
- ATS Optimization: +15-30 points
- Content Quality: +5-15 points
- Formatting: +10-20 points
- Keyword Relevance: +15-25 points
- Impact: +10-20 points

## Error Handling

### Frontend

- File type validation (.txt and .pdf)
- PDF text extraction with progress indicator
- Empty content validation
- Subscription check
- API error display
- Loading state management (file upload, scoring, enhancement)

### Backend

- Text validation
- GPT-5.1 API error handling
- JSON parsing and validation
- Error logging
- Graceful fallbacks

## Performance

### Timing

- **Score CV**: ~3-5 seconds
- **Enhance CV**: ~5-10 seconds
- **Total Flow**: ~8-15 seconds

### Optimization

- Backend processing (no client load)
- Efficient token usage
- Response caching potential
- Progress indicators for UX

## Future Enhancements

### Potential Features

- [x] PDF file support ✅ (Implemented)
- [ ] DOCX file support
- [ ] Side-by-side comparison view
- [ ] History of scored CVs
- [ ] Export to multiple formats
- [ ] Batch CV scoring
- [ ] Industry-specific templates
- [ ] A/B testing different versions
- [ ] Job matching based on CV score

### Analytics

- [ ] Track average score improvements
- [ ] Popular target roles
- [ ] Enhancement acceptance rate
- [ ] User satisfaction metrics

## Files Modified/Created

### Backend

1. ✅ `app/services/openai.service.js` - Added `scoreCVText()` and `enhanceCVText()`
2. ✅ `app/controllers/openai.controller.js` - Added handlers for both endpoints

### Frontend

1. ✅ `src/lib/backendApi.ts` - Added API functions and interfaces
2. ✅ `src/components/CVScoring.tsx` - New component (400+ lines, full-width layout)
3. ✅ `src/pages/DashboardPage.tsx` - Added menu item and section
4. ✅ `src/lib/pdf.ts` - Exported `extractTextFromPdf()` for PDF support

### Documentation

1. ✅ `docs/CV_SCORING_FEATURE.md` - This file

## Status

🎉 **FEATURE COMPLETE & READY**

### Checklist

- [x] Backend API endpoints implemented
- [x] GPT-5.1 integration
- [x] Frontend component created (full-width layout)
- [x] Dashboard integration
- [x] Subscription checks
- [x] Error handling
- [x] Loading states
- [x] Download functionality
- [x] PDF file support with automatic text extraction
- [x] Large text preview area with character counter
- [x] Documentation complete

---

**Implementation Date**: December 1, 2025  
**Model**: GPT-5.1  
**Status**: ✅ Production Ready  
**User Flow**: Upload → Score → Enhance → Download
