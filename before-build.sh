cp ./.python/languages.py ./languages.py
python ./languages.py  ./content/posts ./themes/hugo-theme-stack/data/languages.json
rm -f ./languages.py

cp ./.python/shanbay.py ./shanbay.py
python ./shanbay.py  30 ./themes/hugo-theme-stack/data/shanbay.json
rm -f ./shanbay.py
