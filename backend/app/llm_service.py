from dotenv import load_dotenv
from litellm import completion, image_generation

import os
import requests

# 1. Open the vault
load_dotenv()

# 2. Build the switchboard function
def generate_ai_text(prompt):
    print("Calling OpenAI...")
    
    # 3. Hand over the envelope
    response = completion(
        model="ollama/llama3.2",
        messages=[{"role": "user", "content": prompt}]
    )
    
    # 4. Open the returned package
    actual_text = response.choices[0].message.content
    
    return actual_text

def generate_ai_image(prompt):
    print("Calling DALL-E 3 for image...")
    
    # 1. Ask OpenAI for the image
    response = image_generation(
        prompt=prompt,
        model="dall-e-3",
        size="1024x1024"
    )
    
    # 2. Extract the temporary web link they send back
    image_url = response.data[0].url
    
    # 3. Download the actual image file as binary (BLOB) data
    print("Downloading image to memory...")
    image_blob = requests.get(image_url).content
    
    return image_blob