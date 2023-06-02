import os
import re
import requests

def check_links_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # 匹配 Markdown 文件中的链接
    pattern = r'\[.*?\]\((.*?)\)'
    links = re.findall(pattern, content)

    # 检查链接可用性
    for link in links:
        if link.startswith(('http://', 'https://')):
            try: 
                response = requests.get(link)
                if response.status_code >= 400:
                    print(f'{file_path} - {link} - {response.status_code}')
            except:
                print(f'{file_path} - {link}')


if __name__ == '__main__':
    # 递归检查指定文件夹中的 Markdown 文件
    folder_path = './content'
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            print(file)
            if file.endswith('.md'):
                print(f'Chekcing file {file} start...')
                file_path = os.path.join(root, file)
                check_links_in_file(file_path)
                print(f'Chekcing file {file} finished')

