git reset --hard
git pull
yarn install
kill -2 `lsof -i:3000`
yarn start 
