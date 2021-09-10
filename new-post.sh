postDir=./content/post/$1
postDate=$(date +"%Y-%m-%d %H:%M:%S")
cp -r ./scaffold/post/. $postDir
sed -i "s/{{ date }}/$postDate/g" $postDir/index.md
echo "a new post created at $postDir/index.md"