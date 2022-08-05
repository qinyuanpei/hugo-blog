cp ./.python/languages.py ./languages.py
python ./languages.py
mkdir -p ./static/api/
mv ./languages.json ./static/api/languages.json
rm -f ./languages.py