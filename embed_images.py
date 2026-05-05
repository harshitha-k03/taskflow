import base64
import os
import re

readme_path = 'README.md'
screenshots_dir = 'docs/screenshots'

with open(readme_path, 'r', encoding='utf-8') as f:
    content = f.read()

images = {
    'dashboard': 'dashboard.png',
    'kanban-board': 'kanban-board.png',
    'chat': 'chat.png',
    'ai-chatbot': 'ai-chatbot.png',
    'projects': 'projects.png',
    'team': 'team.png',
    'profile': 'profile.png',
    'login': 'login.png'
}

base64_links = "\n\n<!-- BASE64 IMAGES -->\n"

for key, filename in images.items():
    filepath = os.path.join(screenshots_dir, filename)
    if os.path.exists(filepath):
        with open(filepath, 'rb') as img_file:
            encoded_string = base64.b64encode(img_file.read()).decode('utf-8')
            
        # Replace the path in the table
        pattern = f'docs/screenshots/{filename}'
        content = content.replace(pattern, f'#{key}-img')
        
        # Add to the links section
        base64_links += f'[{key}-img]: data:image/png;base64,{encoded_string}\n'

# Add the base64 data to the end of the README
# Note: we need to replace the URL inside the markdown image tag:
# From: ![Dashboard](docs/screenshots/dashboard.png)
# To: ![Dashboard][dashboard-img]

for key, filename in images.items():
    # Regular expression to find and replace the image syntax
    content = re.sub(
        rf'!\[([^\]]*)\]\(docs/screenshots/{filename}\)',
        rf'![\1][{key}-img]',
        content
    )

with open(readme_path, 'w', encoding='utf-8') as f:
    f.write(content + base64_links)

print("Successfully embedded base64 images into README.md")
