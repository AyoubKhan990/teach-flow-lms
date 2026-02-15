import sys
import json
import random
import time
import os
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from youtube_transcript_api.proxies import GenericProxyConfig

# List of free proxies (for demonstration - in production, use a paid proxy service)
# Format: "http://user:pass@host:port" or "http://host:port"
PROXIES = [
    # Add your proxies here. 
    # Example:
    # "http://123.45.67.89:8080",
]

env_proxies = os.environ.get("TRANSCRIPT_PROXIES", "").strip()
if env_proxies:
    PROXIES = [p.strip() for p in env_proxies.split(",") if p.strip()]

def get_proxy_dict(proxy_url):
    if not proxy_url:
        return None
    return {
        "http": proxy_url,
        "https": proxy_url,
    }

def fetch_transcript(video_id, languages=['en']):
    last_direct_error = None
    proxy_errors = []
    # 1. Try without proxy first
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
        
        # Try to find manually created transcript
        try:
            transcript = transcript_list.find_manually_created_transcript(languages)
        except NoTranscriptFound:
            # Fallback to generated
            try:
                transcript = transcript_list.find_generated_transcript(languages)
            except NoTranscriptFound:
                 # If specific lang not found, get any english or the first available and translate
                 # For now, just getting the first available
                 transcript = transcript_list.find_transcript(languages)

        fetched = transcript.fetch()
        return fetched.to_raw_data()

    except (TranscriptsDisabled, NoTranscriptFound) as e:
        # Fatal errors that proxy won't fix
        return {"error": str(e)}
    except Exception as e:
        # If rate limited or connection error, try proxies
        last_direct_error = str(e)
        print(f"Direct fetch failed: {e}, trying proxies...", file=sys.stderr)

    # 2. Try with proxies
    # Shuffle proxies to distribute load
    if not PROXIES:
        return {"error": f"Direct fetch failed: {last_direct_error or 'unknown error'} (no proxies configured)."}

    random.shuffle(PROXIES)
    
    for proxy in PROXIES:
        try:
            # YouTubeTranscriptApi doesn't directly support proxies in the fetch method easily 
            # without using the underlying requests session.
            # However, the library uses `requests`. We can set environment variables 
            # or use the proxies argument if exposed. 
            # The current version of youtube_transcript_api allows passing proxies to `list_transcripts`?
            # Actually, it supports `proxies` arg in `list_transcripts(video_id, proxies=...)`
            
            proxy_config = GenericProxyConfig(http_url=proxy, https_url=proxy)
            api = YouTubeTranscriptApi(proxy_config=proxy_config)
            transcript_list = api.list(video_id)
            
            try:
                transcript = transcript_list.find_manually_created_transcript(languages)
            except NoTranscriptFound:
                transcript = transcript_list.find_generated_transcript(languages)
            
            fetched = transcript.fetch()
            return fetched.to_raw_data()
            
        except Exception as e:
            # print(f"Proxy {proxy} failed: {e}", file=sys.stderr)
            proxy_errors.append(f"{proxy}: {e}")
            continue

    detail = last_direct_error or "unknown"
    if proxy_errors:
        detail = f"{detail}; proxy failures: " + " | ".join(proxy_errors[:5])
    return {"error": f"Could not fetch transcript (all attempts failed). Details: {detail}"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing video URL or ID"}))
        sys.exit(1)

    input_str = sys.argv[1]
    
    # Extract ID from URL if needed
    video_id = input_str
    if "youtube.com" in input_str or "youtu.be" in input_str:
        if "v=" in input_str:
            video_id = input_str.split("v=")[1].split("&")[0]
        else:
            # handle youtu.be/ID
            video_id = input_str.split("/")[-1].split("?")[0]

    langs = ['en']
    if len(sys.argv) > 2:
        langs = sys.argv[2].split(",")

    try:
        data = fetch_transcript(video_id, langs)
        
        # If it's a list (successful fetch), print it
        if isinstance(data, list):
             # Extract just the text to keep payload small if desired, 
             # but the node service expects the full object or text?
             # The node service expects text. Let's return the list of objects 
             # and let node handle the joining to be safe, or just return text list.
             # The node service does: JSON.parse(stdout) -> if Array -> join text.
             # So returning the standard list of {text, start, duration} is perfect.
             print(json.dumps(data))
        else:
             # Error dict
             print(json.dumps(data))
             
    except Exception as e:
        print(json.dumps({"error": str(e)}))
