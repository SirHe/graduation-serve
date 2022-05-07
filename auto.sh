git reset --hard
git pull
yarn
kill -2 `lsof -i:8888`
yarn start
