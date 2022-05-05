const jwt = require('jsonwebtoken')
const { SECRET_KEY } = require('../config/index')
const { getUserMenu } = require('../models/user')

// 登录鉴权
const loginAuth = (req, res, next) => {
  const token = req.headers['authorization']
  if (token == undefined) {
    return res.status(401).send({
      code: 1,
      message: '未登录',
    })
  } else {
    const { exp, id, isAdmin } = jwt.verify(token.split(' ')[1], SECRET_KEY)

    if (Math.floor(Date.now() / 1000) >= exp) {
      return res.status(401).send({
        code: 1,
        message: '登录已过期',
      })
    }

    req.user = {
      id,
      isAdmin,
    }
    return next()
  }
}

// 用户鉴权
const userAuth = async (req, res, next) => {
  const id = req.user.id
  // 防止携带参数
  const path = req.originalUrl.split('?').shift()
  try {
    const userMenu = await getUserMenu(id)
    const hasPower = userMenu.some(({ url }) => url.indexOf(path) >= 0)
    if (hasPower) {
      next()
    } else {
      res.status(401).send({
        message: '抱歉权限不足',
      })
    }
  } catch (err) {
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

module.exports = {
  loginAuth,
  userAuth,
}
