from dotenv import load_dotenv
from litellm import completion
from huggingface_hub import InferenceClient

import os
import io
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
    print("Calling Hugging Face Cloud (FLUX.1)...")
    
    # Initialize client using your token from the .env file
    client = InferenceClient(api_key=os.environ.get("HF_TOKEN"))
    
    # Request image generation from the serverless API
    image_pil = client.text_to_image(
        prompt=prompt,
        model="black-forest-labs/FLUX.1-schnell"
    )
    
    # Convert the Pillow Image object into raw binary bytes (BLOB data) for PostgreSQL
    print("Converting image to binary blob...")
    img_byte_arr = io.BytesIO()
    image_pil.save(img_byte_arr, format='PNG')
    
    return img_byte_arr.getvalue()