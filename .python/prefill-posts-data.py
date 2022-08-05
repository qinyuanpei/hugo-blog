import json
import datetime
import sys

def run(input, output):
    with open(input, 'rt', encoding='utf-8') as fr:
        tags = {}
        yearly = {}
        categories = {}
        
        posts = json.load(fr)

        for post in posts:

            # 统计不同年份
            post_date = post['date'].replace('T',' ').replace('Z','')
            post_year = datetime.datetime.strptime(post_date, '%Y-%m-%d %H:%M:%S').year
            if post_year in yearly:
                yearly[post_year] = yearly[post_year] + 1
            else:
                yearly[post_year] = 1

            # 统计不同分类
            for category in post['categories']:
                if category in categories:
                    categories[category] = categories[category] + 1
                else:
                    categories[category] = 1
                
            # 统计标签
            for tag in post['tags']:
                if tag in tags:
                    tags[tag] = tags[tag] + 1;
                else:
                    tags[tag] = 1
        
        with open(output, 'wt', encoding='utf-8') as fw:
            print(f'{output} created.')
            json.dump({
                'yearly': yearly,
                'categories': categories,
                'tags': tags
            }, fw)


if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2])