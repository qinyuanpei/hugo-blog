cp ./.python/prefill-posts-data.py ./prefill-posts-data.py
mkdir -p ./public/api/
python ./prefill-posts-data.py ./public/search/index.json ./public/api/posts-chart.json
rm -f ./prefill-posts-data.py

cp ./.python/readme.py ./readme.py
python ./readme.py
cp ./README.md ./public/README.md
rm -f ./readme.py