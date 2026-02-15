import urllib.request
import urllib.parse
import os

def test_download():
    description = "A rocket launching into space"
    encoded_desc = urllib.parse.quote(description)
    image_url = f"https://image.pollinations.ai/prompt/{encoded_desc}"
    print(f"Attempting to download from: {image_url}")
    
    filename = "test_download_img.png"
    try:
        req = urllib.request.Request(
            image_url, 
            data=None, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req) as response, open(filename, 'wb') as out_file:
            out_file.write(response.read())
        
        print(f"Success! Image saved to {filename}")
        print(f"File size: {os.path.getsize(filename)} bytes")
        
        # Clean up
        if os.path.exists(filename):
            os.remove(filename)
            
    except Exception as e:
        print(f"Failed to download: {e}")

if __name__ == "__main__":
    test_download()
