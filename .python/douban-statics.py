import os, json
import datetime

def resolve(inputPath):
    statics = [ 0 for i in  range(12)]
    currrent = datetime.datetime.now()

    if not os.path.exists(inputPath):
        return statics
    
    with open(inputPath, 'rt', encoding='utf-8') as fr:
        histories = json.load(fr)
        for history in histories:
            updated = history['create_time']
            updated = datetime.datetime.strptime(updated, '%Y-%m-%d %H:%M:%S')
            if updated.year == currrent.year:
                statics[updated.month - 1] += 1
            else:
                continue
        
        return statics
    
if __name__ == '__main__':
    booksStatics = resolve('./data/doubanSync/book.json')
    moviesStatics = resolve('./data/doubanSync/movie.json')
    statics = {
        'books': booksStatics,
        'movies': moviesStatics
    }
    with open('./data/doubanSync/statics.json', 'wt', encoding='utf-8') as fw:
        json.dump(statics, fw, ensure_ascii=False)