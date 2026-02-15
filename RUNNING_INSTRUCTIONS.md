# LearnStream - Running Instructions

## ✅ Setup Complete!

The project has been successfully set up with:
- ✅ All dependencies installed (frontend & backend)
- ✅ Environment files created and configured
- ✅ Google OAuth credentials configured
- ✅ MongoDB connection configured (MongoDB service is running)

## 🚀 How to Run the Application

### Option 1: Run in Separate PowerShell Windows (Recommended)

**Step 1: Start Backend Server**
Open a PowerShell window and run:
```powershell
cd LearnStream\server
npm start
```
You should see:
- `✅ MongoDB Connected: localhost`
- `🚀 Server running on port 8000`

**Step 2: Start Frontend Server**
Open a **NEW** PowerShell window and run:
```powershell
cd LearnStream\frontend
npm run dev
```
You should see:
- `VITE v7.x.x ready in xxx ms`
- `➜  Local:   http://localhost:5173/`

**Step 3: Access the Application**
- Open your browser and go to: **http://localhost:5173**
- Backend API is available at: **http://localhost:8000**

### Option 2: Run Both Servers in Background

You can also run both servers in the background using:
```powershell
# Backend
cd LearnStream\server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start"

# Frontend  
cd LearnStream\frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
```

## ✅ Configuration Status

### Backend (.env) - Configured ✅
- ✅ **MongoDB URI**: `mongodb://localhost:27017/learnstream`
- ✅ **Google OAuth Client ID**: Configured
- ✅ **Google OAuth Client Secret**: Configured
- ✅ **Session Secret**: Set
- ⚠️ **Gemini API Keys**: Still need to be set (for AI features)
- ⚠️ **YouTube API Key**: Optional (for enhanced features)

### Frontend (.env) - Configured ✅
- ✅ **API URL**: `http://localhost:8000`
- ✅ **Server URL**: `http://localhost:8000`

## ⚠️ Important Notes

1. **MongoDB**: Make sure MongoDB service is running
   - Check: `Get-Service -Name "*mongo*"`
   - Should show: `Status: Running`

2. **Google OAuth**: The credentials are configured, but make sure:
   - Authorized redirect URI in Google Console: `http://localhost:8000/auth/google/callback`
   - OAuth consent screen is configured

3. **AI Features**: To use AI summaries and quizzes, you need to:
   - Get a Gemini API key from: https://makersuite.google.com/app/apikey
   - Add to `server/.env`:
     ```
     GEMINI_API_KEY_SUMMARY=your_api_key_here
     GEMINI_API_KEY_QUIZ=your_api_key_here
     ```

4. **Ports**: 
   - Backend: Port 8000
   - Frontend: Port 5173
   - Make sure these ports are not in use by other applications

## 🧪 Testing the Application

Once both servers are running:

1. **Test Backend**: Open http://localhost:8000
   - Should show: `🚀 LearnStream server is running...`

2. **Test Frontend**: Open http://localhost:5173
   - Should show the LearnStream homepage

3. **Test Authentication**: 
   - Click "Sign in with Google"
   - Should redirect to Google OAuth
   - After authentication, should redirect back to the app

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running: `Get-Service -Name "*mongo*"`
- Verify `.env` file exists in `server/` directory
- Check for port conflicts: `Get-NetTCPConnection -LocalPort 8000`

### Frontend won't start
- Verify `.env` file exists in `frontend/` directory
- Check for port conflicts: `Get-NetTCPConnection -LocalPort 5173`
- Try deleting `node_modules` and reinstalling: `npm install`

### Can't connect to backend from frontend
- Verify backend is running on port 8000
- Check `VITE_API_URL` in `frontend/.env` matches backend URL
- Check CORS settings (should be configured for `http://localhost:5173`)

### Authentication not working
- Verify Google OAuth credentials in `server/.env`
- Check redirect URI matches: `http://localhost:8000/auth/google/callback`
- Ensure OAuth consent screen is configured in Google Console

## 📝 Next Steps

1. **Get Gemini API Key** (for AI features):
   - Visit: https://makersuite.google.com/app/apikey
   - Create an API key
   - Add to `server/.env` as `GEMINI_API_KEY_SUMMARY` and `GEMINI_API_KEY_QUIZ`

2. **Test the Application**:
   - Start both servers
   - Try signing in with Google
   - Add a YouTube playlist
   - Test video playback and AI features

3. **Optional: YouTube API Key**:
   - Get from: https://console.cloud.google.com/apis/credentials
   - Add to `server/.env` as `YOUTUBE_API_KEY`

---

**Project Status**: ✅ Ready to run (AI features require Gemini API key)

