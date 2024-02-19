import os, time
import requests
import frontmatter
from io import BytesIO


OPEN_AI_BASE_URL = 'https://api.openai.com/v1/chat/completions'
OPEN_AI_API_KEY = os.environ['OPEN_AI_API_KEY']

def generate_summary(content, apiKey):

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {apiKey}'
    }

    payload = {
        'model': 'gpt-3.5-turbo',
        'messages': [
          { 'role': 'system','content':'''You are a highly skilled AI trained in language comprehension and summarization. I would like you to read the text delimited by triple quotes and summarize it into a concise abstract paragraph. Aim to retain the most important points, providing a coherent and readable summary that could help a person understand the main points of the discussion without needing to read the entire text. Please avoid unnecessary details or tangential points.
          Only give me the output and nothing else. Do not wrap responses in quotes. Respond in the Chinese language.'''},
          { 'role': 'user', 'content': content } 
        ],
        'temperature': 0.7,
    }

    try:
        response = requests.post(OPEN_AI_BASE_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            summary = response.json()['choices'][0]['message']['content'].strip()
            return summary
        else:
            print("OpenAI API Error:", response.text)
            return None
    except Exception as e:
            print("OpenAI API Error:", response.text)
            return None


def read_markdown_file(file):
    return frontmatter.load(file)

def write_markdown_file(file, post_data, summary):
    post_data['description'] = summary
    bytes = BytesIO()
    frontmatter.dump(post_data, bytes)  
    file.seek(0,0)
    file.write(bytes.getvalue().decode('utf-8')) 
    print("Summary added to file:", file.name)


blogDir = './content/posts/'
blogFiles = os.listdir(blogDir)
for blogFile in blogFiles:
    time.sleep(5)
    try:
        with open(os.path.join(blogDir,blogFile),'r+', encoding='utf-8-sig') as f:
            post_data = read_markdown_file(f)
            if post_data.metadata['description'] != '':
                continue
            summary = generate_summary(post_data.content, OPEN_AI_API_KEY)
            if (summary is None):
                continue
            write_markdown_file(f, post_data, summary)  
    except Exception as e:
        print("Summary is ignored:", blogFile)
        continue