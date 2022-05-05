const express = require('express')
const app = express()
const shell = require('shelljs')

app.get('/restart', function (req, res) {
  res.send('更新通知已收到，开始更新')

  // 开放脚本权限
  shell.exec('chmod u+x ./auto.sh')
  // 执行脚本
  shell.exec('./auto.sh')
})

app.listen(5002, () => console.log('OK'))
