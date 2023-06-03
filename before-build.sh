cp ./.python/languages.py ./languages.py
python ./languages.py  ./content/posts ./themes/hugo-theme-stack/data/languages.json
rm -f ./languages.py

cp ./.python/shanbay.py ./shanbay.py
python ./shanbay.py  30 ./themes/hugo-theme-stack/data/shanbay.json
rm -f ./shanbay.py

git rev-parse HEAD > VERSION.txt

cp ./.python/process-image.py ./process-image.py
python ./process-image.py  B8DTNBm5r9dL30YVw3KwgXcCjFFWtvSd ./content/
rm -f ./process-image.py

