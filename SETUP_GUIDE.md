# LearnStream Setup Guide

## ✅ Installation Complete

The project has been cloned and dependencies have been installed. Follow these steps to run the application:

## 📋 Prerequisites Checklist

Before running the application, you need to set up:

1. **MongoDB Database**
   - Option A: Install MongoDB locally (https://www.mongodb.com/try/download/community)
   - Option B: Use MongoDB Atlas (free tier available at https://www.mongodb.com/cloud/atlas)

2. **Google OAuth Credentials** (for authentication)
   - Go to https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `http://localhost:8000/auth/google/callback`

3. **Google Gemini API Key** (for AI features)
   - Get API key from: https://makersuite.google.com/app/apikey
   - Or: https://aistudio.google.com/app/apikey

4. **YouTube API Key** (optional, for enhanced features)
   - Get from: https://console.cloud.google.com/apis/credentials

## 🔧 Environment Configuration

### Backend (.env in `server/` directory)

Edit `LearnStream/server/.env` and update these values:

```env
# Database - REQUIRED
MONGO_URI=mongodb://localhost:27017/learnstream
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/learnstream

# Google OAuth - REQUIRED for authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_random_session_secret_here_change_this

# Gemini API - REQUIRED for AI features
GEMINI_API_KEY_SUMMARY=your_gemini_api_key
GEMINI_API_KEY_QUIZ=your_gemini_api_key

# YouTube API - OPTIONAL
YOUTUBE_API_KEY=your_youtube_api_key
```

### Frontend (.env in `frontend/` directory)

The frontend `.env` file is already configured with:
```env
VITE_API_URL=http://localhost:8000
VITE_SERVER_URL=http://localhost:8000
```

## 🚀 Running the Application

### Step 1: Start MongoDB (if using local MongoDB)

Make sure MongoDB is running on your system. If using MongoDB Atlas, skip this step.

### Step 2: Start the Backend Server

Open a terminal and run:

```powershell
cd LearnStream\server
npm start
```

The server should start on `http://localhost:8000`

### Step 3: Start the Frontend Development Server

Open a **new terminal** and run:

```powershell
cd LearnStream\frontend
npm run dev
```

The frontend should start on `http://localhost:5173`

### Step 4: Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000

## ⚠️ Important Notes

1. **Node.js Version**: The project requires Node.js v20.9.0 or higher. You currently have v20.7.0, which may cause some warnings but should still work for basic functionality.

2. **MongoDB Connection**: Make sure MongoDB is running before starting the backend server, otherwise the server will fail to start.

3. **Environment Variables**: The application will not work properly without the required environment variables (MongoDB URI, Google OAuth credentials, and Gemini API keys).

4. **Python**: Some features may require Python for transcript processing. Make sure Python is installed and accessible in your PATH.

## 🐛 Troubleshooting

### Server won't start
- Check if MongoDB is running and the MONGO_URI is correct
- Verify all required environment variables are set in `server/.env`
- Check if port 8000 is already in use

### Frontend can't connect to backend
- Ensure backend is running on port 8000
- Check that `VITE_API_URL` in `frontend/.env` matches the backend URL
- Check CORS settings in the backend

### Authentication not working
- Verify Google OAuth credentials are correct
- Ensure the redirect URI matches exactly: `http://localhost:8000/auth/google/callback`
- Check that SESSION_SECRET is set in backend `.env`

## 📚 Additional Resources

- Project README: `README.md`
- Deployment Guide: `DEPLOY.md`
- Live Demo: https://learnstream.netlify.app

