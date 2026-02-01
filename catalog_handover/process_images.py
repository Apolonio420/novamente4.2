import sys
import os
from PIL import Image

def add_logo(image_path, output_path, logo_path, opacity=1.0):
    try:
        img = Image.open(image_path)
        logo = Image.open(logo_path)

        # Calculate logo size (e.g., 20% of image width for visibility)
        target_width = int(img.width * 0.20)
        logo_ratio = logo.height / logo.width
        target_height = int(target_width * logo_ratio)
        
        logo = logo.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        # Position: bottom right with some padding
        padding = int(img.width * 0.05)
        position = (img.width - target_width - padding, img.height - target_height - padding)
        
        # Handle transparency
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        if logo.mode != 'RGBA':
            logo = logo.convert('RGBA')

        # Apply opacity
        if opacity < 1.0:
            # Multiply existing alpha by opacity
            # split() returns (r, g, b, a)
            r, g, b, a = logo.split()
            # method 'point' can be used to apply a lambda/function to each pixel value
            # but simpler here since we want to scale the alpha
            # We can use ImageEnhance.Brightness on the alpha channel if we treat it as an image, or just math
            # Using point:
            a = a.point(lambda p: int(p * opacity))
            logo.putalpha(a)
            
        # Create a transparent layer for the composition
        layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
        layer.paste(logo, position, logo) # Use logo as mask for transparency
        
        # Composite
        out = Image.alpha_composite(img, layer)
        
        # Convert back to RGB for JPEG if needed, keep RGBA for PNG to preserve quality/background
        if output_path.lower().endswith('.jpg') or output_path.lower().endswith('.jpeg'):
            out = out.convert('RGB')
        # For PNG we might want to keep RGBA or RGB depending on source. 
        # If source was PNG, it might have transparency.
        
        out.save(output_path)
        print(f"Processed: {output_path}")
        
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python process_images.py <input_image> <output_image> <logo_image> [opacity]")
        sys.exit(1)
        
    input_img = sys.argv[1]
    output_img = sys.argv[2]
    logo_img = sys.argv[3]
    opacity = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
    
    add_logo(input_img, output_img, logo_img, opacity)
