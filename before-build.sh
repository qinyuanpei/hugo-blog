cp ./.python/languages.py ./languages.py
python ./languages.py  ./content/posts ./data/languages.json
rm -f ./languages.py


cp ./.python/shanbay.py ./shanbay.py
python ./shanbay.py  30 ./data/shanbay.json
rm -f ./shanbay.py

git rev-parse HEAD > VERSION.txt

cp ./.python/process-image.py ./process-image.py
python ./process-image.py  B8DTNBm5r9dL30YVw3KwgXcCjFFWtvSd ./content/
rm -f ./process-image.py

python ./.python/netease-music.py

cp ./.python/douban-statics.py ./douban-statics.py
python ./douban-statics.py
rm -f ./douban-statics.py

cp ./.python/extract-summary.py ./extract-summary.py
python ./extract-summary.py
rm -f ./extract-summary.py
