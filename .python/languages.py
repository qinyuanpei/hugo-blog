import os
import json
import sys

# 列举所有博客
def listPosts(rootPath):
    posts = []
    children = os.listdir(rootPath)
    for child in children:
        filePath = os.path.join(rootPath,child)
        fileExt = os.path.splitext(filePath)[-1]
        if (not fileExt == '.md'):
            continue
        if os.path.isfile(filePath):
            posts.append(filePath)
        else:
            posts.extend(listPosts(filePath))
    return posts

# 分析语言使用情况
def analyseLanguages(posts):
    languages = {}
    for post in posts:
        try:
            fi = open(post,'rt',encoding='utf-8')
            text = list(map(lambda x:x.strip().replace('\n','').replace('\t',''), fi.readlines()))
            matches = list(filter(lambda x:x.startswith('```') and len(x) > 3, text))
            if len(matches) > 0:
                for match in matches:
                    language = match[3:]
                    if language.lower() == "plain":
                        continue
                    if language.lower() == "csharp":
                        language = 'C#'
                    if language.lower() == "python":
                        language = 'Python'
                    if language.lower() == "javascript" or language.lower() == "js":
                        language = 'JavaScript'
                    if language.lower() == "shell" or language.lower() == "bash":
                        language = 'Shell'
                    if language.lower() == "yaml" or language.lower() == "yml":
                        language = language.upper()
                    if language in ['shell','json','csharp','lua','yaml','yml','plain']:
                        print(f'{post} maybe need a check for code blocks.')
                    if language in languages.keys():
                        languages[language] = languages[language] + 1
                    else:
                        languages[language] = 1
        except Exception as ex:
            print(f'{post} maybe need a check for encoding.')

    #排序后取前5种语言输出        
    languages = sorted(languages.items(), key=lambda d:d[1], reverse = True)
    return dict(languages[:6])

if __name__ == '__main__':
    input = sys.argv[1]
    output = sys.argv[2]
    posts = listPosts(input)
    languages = analyseLanguages(posts)
    with open(output,'wt',encoding='utf-8') as f:
        print(f'{output} created.')
        f.write(str(json.dumps(languages)))


