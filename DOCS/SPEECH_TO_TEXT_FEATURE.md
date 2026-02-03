# Speech-to-Text Interview Feature

## 🎙️ Overview

Users can now **speak their answers** during mock interviews! The system automatically transcribes speech, fills the input field, and sends the message when you finish speaking.

## ✨ Key Features

### 1. **Voice Input with Mic Button**
- Beautiful mic button 🎤 inside the input field
- Click to start speaking
- Auto-transcribes your speech in real-time
- Auto-sends when you stop speaking

### 2. **Real-Time Transcription**
- See your words appear as you speak
- Interim results show while speaking
- Final transcript when you pause

### 3. **Auto-Send After Speaking**
- Automatically detects when you stop speaking (2 seconds of silence)
- Shows your transcribed text briefly
- Auto-sends to AI interviewer
- No need to click "Send" button!

### 4. **Visual Feedback**
- 🔵 **Blue mic button** = Ready to record
- 🔴 **Red pulsing button** = Recording now
- 🔴 **Red dot + "Recording..."** = Live status
- ✅ **Text appears** = Speech recognized

## 🚀 How to Use

### **Step 1: Start Interview**
1. Click "Start Interview"
2. Camera loads automatically
3. AI asks first question

### **Step 2: Click Mic to Speak**
1. Look for the **blue mic icon** 🎤 inside the input field
2. Click it
3. Button turns **red** and starts pulsing
4. You'll see "Recording... Speak now!"

### **Step 3: Speak Your Answer**
1. Speak clearly and naturally
2. Watch your words appear in real-time
3. Don't rush - speak at normal pace

### **Step 4: Stop Speaking**
1. **Option A**: Just pause for 2 seconds → Auto-stops
2. **Option B**: Click red mic button to stop immediately

### **Step 5: Auto-Send**
1. Speech recognition stops
2. Your full answer appears in input
3. After 0.8 seconds, message auto-sends
4. AI processes and responds

## 🎨 UI Design

### **Input Field with Integrated Mic**
```
┌─────────────────────────────────────────┐
│  Type or click mic to speak... 🎤      │
└─────────────────────────────────────────┘
```

### **While Recording**
```
┌─────────────────────────────────────────┐
│  I am a software engineer with... 🔴  │
└─────────────────────────────────────────┘
    🔴 Recording... Speak now!
```

### **States**

#### **Ready State** (Not Recording)
- Blue mic button
- Input enabled
- Placeholder: "Type or click mic to speak..."

#### **Recording State**
- Red pulsing mic button
- Input disabled (shows transcription)
- Status: "🔴 Recording... Speak now!"
- Live transcription appears

#### **Processing State**
- Input shows final transcript
- Brief pause (0.8s) before sending
- Then auto-clears and sends

## 🔧 Technical Details

### **Web Speech API**
Uses browser's built-in Speech Recognition API:
- `SpeechRecognition` (Chrome, Edge)
- `webkitSpeechRecognition` (Safari)

### **Browser Support**
✅ **Supported:**
- Chrome 25+ (Desktop & Android)
- Edge 79+
- Safari 14.1+ (macOS & iOS)
- Opera 27+

❌ **Not Supported:**
- Firefox (uses different API)
- Internet Explorer

### **Language**
- Default: English (en-US)
- Configurable in `useSpeechRecognition.ts`

### **Auto-Stop Logic**
```typescript
// Stops after 2 seconds of silence
silenceTimer = setTimeout(() => {
  stopRecording();
}, 2000);
```

### **Auto-Send Logic**
```typescript
// Sends 0.8 seconds after speech ends
setTimeout(() => {
  sendMessage(transcript);
}, 800);
```

## 📋 Features in Detail

### **1. Continuous Listening**
- Records until you pause or click stop
- Can speak multiple sentences
- Handles punctuation automatically

### **2. Interim Results**
- Shows words as you speak (live feedback)
- Updates in real-time
- Helps you know it's working

### **3. Final Transcript**
- Complete sentence when you pause
- Cleaned up and formatted
- Ready to send

### **4. Error Handling**
- Microphone permission errors
- No speech detected
- Network errors
- Device not found

## 🛡️ Privacy & Permissions

### **Microphone Access**
First time you click the mic button:
1. Browser prompts: "Allow microphone access?"
2. Click "Allow"
3. Permission saved for future use

### **macOS System Permissions**
If mic doesn't work:
1. System Settings → Privacy & Security
2. Click "Microphone"
3. Enable your browser
4. Restart browser

### **Data Privacy**
- ✅ Speech processed by browser (not our servers)
- ✅ Uses browser's Speech Recognition API
- ✅ Transcript sent only to AI for response
- ✅ No audio recording saved

## 🎯 User Flow Example

```
1. AI: "Tell me about yourself"
   
2. User clicks 🎤 (blue mic button)
   
3. Button turns red 🔴, starts pulsing
   Status: "Recording... Speak now!"
   
4. User speaks: "I am a software engineer..."
   Text appears live: "I am a software engineer..."
   
5. User pauses (2 seconds)
   Recording auto-stops
   
6. Full text shown: "I am a software engineer with 5 years of experience"
   
7. After 0.8s, message auto-sends
   
8. Input clears, AI processes response
   
9. AI responds with follow-up question
```

## 🐛 Troubleshooting

### **Mic Button Not Showing**
**Cause**: Browser doesn't support Speech Recognition
**Solution**: 
- Use Chrome, Edge, or Safari
- Update browser to latest version
- Check browser compatibility

### **"Microphone Access Denied"**
**Cause**: Browser permissions not granted
**Solution**:
1. Click camera icon 🎥 in address bar
2. Select "Allow" for microphone
3. Refresh page
4. Try again

### **"No Speech Detected"**
**Cause**: Mic not picking up voice
**Solution**:
- Check mic is not muted
- Speak louder/closer to mic
- Test mic in System Settings
- Try external mic

### **Transcription Inaccurate**
**Cause**: Background noise or unclear speech
**Solution**:
- Find quiet environment
- Speak clearly and at normal pace
- Use headset microphone
- Avoid filler words (um, uh, etc.)

### **Auto-Send Not Working**
**Cause**: Transcript is empty or whitespace
**Solution**:
- Make sure you actually spoke
- Check transcript appears before sending
- Manually type if issues persist

### **Recording Never Stops**
**Cause**: Continuous background noise detected
**Solution**:
- Click red mic button to stop manually
- Reduce background noise
- Use quieter environment

## ⚙️ Configuration

### **Change Silence Timeout**
Edit `src/hooks/useSpeechRecognition.ts`:
```typescript
// Auto-stop after 2 seconds of silence
silenceTimerRef.current = setTimeout(() => {
  stopRecording();
}, 2000); // Change this value (in milliseconds)
```

### **Change Auto-Send Delay**
Edit `src/components/MentorshipHub.tsx`:
```typescript
setTimeout(async () => {
  // Send message
}, 800); // Change this value (in milliseconds)
```

### **Change Language**
Edit `src/hooks/useSpeechRecognition.ts`:
```typescript
recognition.lang = 'en-US'; // Change to 'es-ES', 'fr-FR', etc.
```

### **Disable Auto-Send**
If you want manual send only:
```typescript
// Comment out the auto-send useEffect in MentorshipHub.tsx
```

## 🌟 Benefits

### **For Users:**
- ✅ Faster interview responses
- ✅ More natural conversation flow
- ✅ Hands-free operation
- ✅ Great for accessibility
- ✅ Practice speaking skills

### **For Interview Experience:**
- ✅ More realistic (like real interview)
- ✅ Tests verbal communication
- ✅ Reduces typing time
- ✅ Focus on content, not typing
- ✅ Better for mobile users

## 📊 Supported Languages

While we default to English, Speech Recognition supports many languages:

- **English**: en-US, en-GB, en-AU, en-CA
- **Spanish**: es-ES, es-MX
- **French**: fr-FR
- **German**: de-DE
- **Italian**: it-IT
- **Portuguese**: pt-BR, pt-PT
- **Chinese**: zh-CN
- **Japanese**: ja-JP
- **Korean**: ko-KR
- And many more!

## 🔮 Future Enhancements

Planned features:
- [ ] Multiple language selection in UI
- [ ] Accent detection and adaptation
- [ ] Voice tone analysis
- [ ] Speaking pace feedback
- [ ] Pause/Resume recording
- [ ] Edit transcript before sending
- [ ] Voice commands (e.g., "send", "cancel")

## 📚 API Reference

### **useSpeechRecognition Hook**

```typescript
const {
  isListening,        // boolean: Currently recording
  transcript,         // string: Final transcript
  interimTranscript,  // string: Live transcript
  isSupported,        // boolean: Browser support
  error,              // string | null: Error message
  startListening,     // () => void: Start recording
  stopListening,      // () => void: Stop recording
  resetTranscript     // () => void: Clear transcript
} = useSpeechRecognition();
```

## ✅ Testing Checklist

Before deploying:
- [ ] Test mic button appears in input
- [ ] Test clicking mic starts recording
- [ ] Test live transcription shows
- [ ] Test auto-stop after 2 seconds silence
- [ ] Test manual stop with mic button
- [ ] Test auto-send after speech ends
- [ ] Test error handling (no permission)
- [ ] Test on Chrome
- [ ] Test on Safari
- [ ] Test on mobile
- [ ] Test with different accents
- [ ] Test in noisy environment

---

## 🎉 Summary

**What Users Get:**
1. Click 🎤 mic button
2. Speak their answer naturally
3. Watch it transcribe in real-time
4. Auto-sends when they finish
5. No typing needed!

**Result:** Faster, more natural, and more realistic mock interviews! 🚀

---

**Note**: Requires microphone permissions and modern browser with Speech Recognition support.

