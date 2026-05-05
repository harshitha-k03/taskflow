import re

with open('README.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the Base64 block at the bottom
if '<!-- BASE64 IMAGES -->' in content:
    content = content.split('<!-- BASE64 IMAGES -->')[0]

# Remove the screenshots table
table_pattern = r'## 📸 Screenshots.*?(?=## ✨ Features)'
content = re.sub(table_pattern, '', content, flags=re.DOTALL)

# Revert any remaining reference tags (e.g., ![Dashboard][dashboard-img])
# Because the regex previously matched them, if there are any left, we'll just clean them up
for tag in ['dashboard-img', 'kanban-board-img', 'chat-img', 'ai-chatbot-img', 'projects-img', 'team-img', 'profile-img', 'login-img']:
    content = re.sub(rf'!\[([^\]]*)\]\[{tag}\]', '', content)

# Remove extra newlines before ## ✨ Features
content = content.replace('\n\n\n\n## ✨ Features', '\n\n## ✨ Features')

# Now insert the relative path images directly inline under the feature headings.
dashboard_img = "\n<img src=\"docs/screenshots/dashboard.png\" width=\"100%\" alt=\"Dashboard\" style=\"border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\" />\n\n"
login_img = "\n<img src=\"docs/screenshots/login.png\" width=\"100%\" alt=\"Login\" style=\"border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\" />\n\n"
kanban_img = "\n<img src=\"docs/screenshots/kanban-board.png\" width=\"100%\" alt=\"Kanban Board\" style=\"border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\" />\n\n"
chat_img = "\n<img src=\"docs/screenshots/chat.png\" width=\"100%\" alt=\"Chat\" style=\"border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\" />\n\n"
chatbot_img = "\n<img src=\"docs/screenshots/ai-chatbot.png\" width=\"100%\" alt=\"AI Chatbot\" style=\"border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\" />\n\n"
team_img = "\n<img src=\"docs/screenshots/team.png\" width=\"100%\" alt=\"Team Overview\" style=\"border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\" />\n\n"
projects_img = "\n<img src=\"docs/screenshots/projects.png\" width=\"100%\" alt=\"Projects Directory\" style=\"border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\" />\n\n"
profile_img = "\n<img src=\"docs/screenshots/profile.png\" width=\"100%\" alt=\"User Profile\" style=\"border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\" />\n\n"

# 1. Main Dashboard under Features
content = content.replace('## ✨ Features\n', f'## ✨ Features\n{dashboard_img}')

# 2. Kanban and Projects under Core
content = content.replace('### Core\n', f'### Core\n{kanban_img}{projects_img}')

# 3. Chat and Team under Real-Time Collaboration
content = content.replace('### Real-Time Collaboration\n', f'### Real-Time Collaboration\n{chat_img}{team_img}')

# 4. Chatbot and Profile under Quality of Life
content = content.replace('### Quality of Life\n', f'### AI Assistant & Quality of Life\n{chatbot_img}{profile_img}')

# 5. Login under Quick Start
content = content.replace('## 🚦 Quick Start\n', f'## 🚦 Quick Start\n{login_img}')

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Formatting applied successfully.")
