# YouTube API Key Setup Guide

## Issue: "Playlist not found" Error

The error "Playlist not found" occurs because the YouTube API key is not configured or is invalid.

## How to Get a YouTube API Key

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create a New Project (or select existing)
1. Click on the project dropdown at the top
2. Click "New Project"
3. Enter a project name (e.g., "LearnStream")
4. Click "Create"

### Step 3: Enable YouTube Data API v3
1. Go to: https://console.cloud.google.com/apis/library
2. Search for "YouTube Data API v3"
3. Click on it and click "Enable"

### Step 4: Create API Credentials
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the API key that appears
4. (Optional but recommended) Click "Restrict Key" and:
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Click "Save"

### Step 5: Add API Key to Your Project
1. Open `LearnStream/server/.env` file
2. Find the line: `YOUTUBE_API_KEY=your_youtube_api_key`
3. Replace `your_youtube_api_key` with your actual API key:
   ```
   YOUTUBE_API_KEY=AIzaSy...your_actual_key_here
   ```
4. Save the file
5. **Restart the backend server** for changes to take effect

## Important Notes

- **Free Quota**: YouTube Data API v3 provides 10,000 units per day for free
- **Rate Limits**: Each API call consumes units (playlist fetch = ~1-2 units)
- **Key Security**: Never commit your API key to version control (it's already in .gitignore)

## Testing Your API Key

After adding the key and restarting the server, try adding a playlist again. You should see:
- ✅ Successfully added playlists/videos
- ❌ Clear error messages if something goes wrong (instead of generic "Playlist not found")

## Troubleshooting

### Error: "Invalid YouTube API key"
- Make sure you copied the entire key correctly
- Check for extra spaces or line breaks
- Verify the key is enabled for YouTube Data API v3

### Error: "YouTube API quota exceeded"
- You've exceeded the daily free quota (10,000 units)
- Wait until the next day or upgrade your quota in Google Cloud Console

### Error: "Playlist not found"
- Check that the playlist URL is correct
- Make sure the playlist is public (private playlists won't work)
- Verify your API key has the correct permissions

## Need Help?

If you continue to have issues:
1. Check the backend server console for detailed error messages
2. Verify your API key in Google Cloud Console
3. Make sure the backend server was restarted after adding the key

