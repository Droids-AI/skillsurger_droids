# Camera Permissions Troubleshooting Guide

## 🎥 Camera Not Working on Localhost?

If you're seeing "Starting Camera... Please allow camera access" and nothing happens, follow these steps:

---

## 🍎 **For macOS Users**

### Step 1: Check macOS System Permissions

1. Open **System Settings** (or System Preferences)
2. Go to **Privacy & Security**
3. Click on **Camera** in the left sidebar
4. Find your browser (Chrome, Safari, Firefox, etc.)
5. **Toggle it ON** ✅

**Screenshot location:**
```
System Settings → Privacy & Security → Camera → [Your Browser] ✓
```

### Step 2: Check Browser Permissions

#### **Chrome / Edge / Brave:**
1. Look for a camera icon 🎥 in the address bar (usually top-right)
2. Click it and select **"Allow"**
3. If you previously denied:
   - Click the camera icon
   - Select **"Always allow localhost to access your camera"**
   - Click **Done**
4. Refresh the page

**Alternative method:**
1. Go to `chrome://settings/content/camera`
2. Make sure camera is not blocked
3. Add `http://localhost:3000` to "Allowed" sites

#### **Firefox:**
1. Look for a camera icon in the address bar (left side)
2. Click it and select **"Allow"**
3. If you previously denied:
   - Click the lock icon 🔒 in address bar
   - Click "More information"
   - Go to "Permissions" tab
   - Find "Use the Camera"
   - Select "Allow"
4. Refresh the page

#### **Safari:**
1. Go to Safari → Settings (or Preferences)
2. Click **Websites** tab
3. Select **Camera** in the left sidebar
4. Find `localhost` and set to **Allow**
5. Refresh the page

### Step 3: Restart Browser
If still not working:
1. **Completely quit** your browser (Cmd+Q)
2. Reopen it
3. Try accessing camera again

---

## 🖥️ **For Windows Users**

### Step 1: Check Windows Settings
1. Open **Settings** (Windows key + I)
2. Go to **Privacy & Security**
3. Click **Camera**
4. Make sure:
   - "Camera access" is **ON**
   - "Let apps access your camera" is **ON**
   - Your browser has permission

### Step 2: Check Browser Permissions
Follow the same browser steps as macOS above.

---

## 🔧 **Common Issues & Solutions**

### Issue 1: "Camera is being used by another application"
**Solution:**
- Close all other apps that might use camera (Zoom, Teams, Skype, etc.)
- Restart your browser
- Try again

### Issue 2: "No camera found"
**Solution:**
- Check if your camera is connected (for external cameras)
- Check if built-in camera is enabled in BIOS (rare)
- Try a different browser
- Restart your computer

### Issue 3: Camera works in other apps but not in browser
**Solution:**
1. Check browser permissions (see above)
2. Clear browser cache and cookies
3. Try in an Incognito/Private window
4. Update your browser to latest version

### Issue 4: Permission popup never appears
**Solution:**
1. You might have previously denied permission
2. Click camera icon in address bar and change to "Allow"
3. Or go to browser settings → Site Settings → Camera
4. Remove localhost from blocked sites
5. Refresh the page

---

## 🚀 **Quick Fix Checklist**

✅ Camera icon in address bar set to "Allow"  
✅ macOS System Settings → Camera → Browser enabled  
✅ No other apps using camera  
✅ Browser has latest updates  
✅ Page refreshed after changing permissions  
✅ Browser completely restarted  

---

## 🧪 **Test Your Camera**

Before using in the app, test if camera works:

1. **Chrome**: Go to `chrome://settings/content/camera` and click "Test"
2. **Firefox**: Go to [WebRTC Test Page](https://mozilla.github.io/webrtc-landing/gum_test.html)
3. **Safari**: Open Photo Booth app on Mac
4. **Any browser**: Go to https://webcamtests.com/

If camera works there but not in the app, it's a permission issue.

---

## 📞 **Still Not Working?**

### Check Browser Console for Errors:
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Look for error messages about camera
4. Common errors:
   - `NotAllowedError` → Permission denied
   - `NotFoundError` → No camera detected
   - `NotReadableError` → Camera in use by another app

### Try Different Browser:
- Chrome ✅ (Best compatibility)
- Firefox ✅ (Good)
- Safari ✅ (Good on Mac)
- Edge ✅ (Good)

### Check Browser Version:
Make sure you're using a modern browser version:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🔐 **Security Note**

Your browser and OS require explicit permission for camera access to protect your privacy. This is a security feature, not a bug!

**Localhost Exception:**
- Most browsers allow camera on `localhost` without HTTPS
- If deploying to production, you MUST use HTTPS for camera access

---

## ✅ **After Fixing Permissions**

Once camera is working:
1. You'll see your face in the rounded rectangle
2. Green "Camera On" indicator will appear
3. No more "Starting Camera..." message
4. You can proceed with the interview!

---

## 📚 **Additional Resources**

- [Chrome Camera Troubleshooting](https://support.google.com/chrome/answer/2693767)
- [Firefox Camera Permissions](https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions)
- [Safari Website Permissions](https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac)
- [macOS Camera Privacy](https://support.apple.com/guide/mac-help/control-access-to-your-camera-mchlf6d108da/mac)

---

**Remember: Granting camera permission is safe for localhost during development!** 🔒

