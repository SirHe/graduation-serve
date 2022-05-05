git reset --hard
git pull
npm i
kill -2 `lsof -i:3000`
npm run start
