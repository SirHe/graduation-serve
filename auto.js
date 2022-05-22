const express = require('express')
const app = express()
const shell = require('shelljs')

app.get('/restart', (req, res) => {
  res.send('更新通知已收到，开始更新')

  // // 开放脚本权限
  // shell.exec('chmod u+x ./auto.sh')
  // // 执行脚本
  // shell.exec('./auto.sh')
  shell.exec('git pull')
  shell.exec('yarn')
  shell.exec('forever stopall')
  shell.exec('forever start auto.js')
  shell.exec('forever start ./bin/www')
  // shell.exit(1)
})

app.listen(3000, () => console.log('OK'))
