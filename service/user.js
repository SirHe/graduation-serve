const multiparty = require('multiparty')
const path = require('path')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const { v1 } = require('uuid')
const { getToken, md5 } = require('../utils')
const { SECRET_KEY } = require('../config/index')
const sendEmail = require('../utils/sendEmail')
const sendSMS = require('../utils/sendSMS')
// const axios = require('axios')
const {
  getUserInfobyUsernameAndPassword,
  getUserInfoById,
  updateUserInfo,
  getUserRoles,
  getClientMenu: getClientMenuM,
  add,
  getList,
  deleteUser: deleteUserM,
  toggleUserState: toggleUserStateM,
} = require('../models/user')

const login = async (req, res, next) => {
  const { username, password } = req.body
  if (!username) {
    return res.status(422).json({ message: '用户名不能空白' })
  }

  if (!password) {
    return res.status(422).json({ message: '密码不能空白' })
  }

  try {
    const userInfo = await getUserInfobyUsernameAndPassword(
      username,
      md5(password)
    )
    const id = userInfo.id

    const roles = await getUserRoles(id)
    const isAdmin = roles.some((role) => role.name === 'admin')

    const menus = await getClientMenuM(id)

    res.send({
      code: 0,
      message: '登录成功！',
      data: {
        tokenHead: 'Bearer',
        token: getToken({ id, isAdmin }),
        menus: menus.map((menu) => menu.url),
        userInfo,
      },
    })
  } catch (err) {
    res.status(401).json({ message: '账号或者密码错误' })
  }
}

const getUserInfo = async (req, res, next) => {
  try {
    const userInfo = await getUserInfoById(req.user.id)
    res.send({
      code: 0,
      message: '个人信息获取成功',
      data: userInfo,
    })
  } catch (err) {
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const setUserInfo = async (req, res, next) => {
  const fromData = new multiparty.Form()
  fromData.parse(req, async (err, fields, files) => {
    // 数据库对应修改字段
    const { nickname, brief, phone, email, address } = fields
    const userInfo = {
      email: email[0],
      nickname: nickname[0],
      brief: brief[0],
      phone: phone[0],
      address: address[0],
    }
    if (files.avatarFile) {
      // 保存图片
      const { path: filePath } = files.avatarFile[0]
      const fileName = `${v1().replace(/-/g, '')}.${filePath.split('.').at(-1)}`
      const avatarFile = fs.readFileSync(filePath)
      fs.writeFileSync(
        path.join(__dirname, `../public/${fileName}`),
        avatarFile
      )

      userInfo.avatar = fileName
    }

    try {
      await updateUserInfo(req.user.id, userInfo)
      res.send({
        code: 0,
        message: '个人信息修改成功',
      })
    } catch (err) {
      res.status(500).send({
        message: '服务器错误，请稍后重试',
      })
    }
  })
}

const addUser = async (req, res, next) => {
  const fromData = new multiparty.Form()
  fromData.parse(req, async (err, fields, files) => {
    // 数据库对应修改字段
    const { nickname, brief, phone, email, address, role, username, password } =
      fields
    const userInfo = {
      id: v1().replace(/-/g, ''),
      email: email[0],
      nickname: nickname[0],
      brief: brief[0],
      phone: phone[0],
      address: address[0],
      role: role[0],
      username: username[0],
      password: md5(password[0]),
    }
    if (files.avatarFile) {
      // 保存图片
      const { path: filePath } = files.avatarFile[0]
      const fileName = `${v1().replace(/-/g, '')}.${filePath.split('.').at(-1)}`
      const avatarFile = fs.readFileSync(filePath)
      fs.writeFileSync(
        path.join(__dirname, `../public/${fileName}`),
        avatarFile
      )

      userInfo.avatar = fileName
    }
    try {
      await add(userInfo)
      await res.send({
        code: 0,
        message: '用户添加成功',
      })
    } catch (err) {
      res.status(500).send({
        message: '服务器错误，请稍后重试',
      })
    }
  })
}

const getUserList = async (req, res, next) => {
  const { isAdmin } = req.user
  const { page, size } = req.query
  if (!isAdmin) {
    return res.status(422).json({ message: '抱歉，权限不足' })
  }
  try {
    const { rows, total } = await getList(page, size)
    res.send({
      code: 0,
      message: '用户列表获取成功',
      data: rows,
      total,
    })
  } catch (err) {
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const deleteUser = async (req, res, next) => {
  const id = req.body.id
  console.log(id)
  try {
    await deleteUserM(id)
    res.send({
      code: 0,
      message: '用户删除成功',
    })
  } catch (err) {
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const toggleUserState = async (req, res, next) => {
  const { enabled, id } = req.body
  try {
    await toggleUserStateM(id, enabled)
    res.send({
      code: 0,
      message: `用户${enabled ? '激活' : '禁用'}成功`,
    })
  } catch (err) {
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const sendCode = async (req, res, next) => {
  const { phone, email, type } = req.body
  const code = Math.floor(Math.random() * (9999 - 1000)) + 1000
  if (type === 'email') {
    try {
      await sendEmail(
        email,
        '智慧乡村信息服务平台',
        `<p>您好，欢迎注册智慧乡村信息服务平台。您的验证码是：<b>${code}</b>，如果不是本人操作，请忽略本邮件。</p>`
      )
      res.send({
        code: 0,
        message: '验证码发送成功！',
        data: {
          tokenHead: 'Bearer',
          token: getToken({ code, email }),
        },
      })
    } catch (err) {
      console.log(err)
    }
  } else if (type === 'phone') {
    try {
      await sendSMS(phone, code)
      res.send({
        code: 0,
        message: '验证码发送成功！',
        data: {
          tokenHead: 'Bearer',
          token: getToken({ code, phone }),
        },
      })
    } catch (err) {
      console.log(err)
    }
  }
}

const checkCode = (req, res, next) => {
  const token = req.headers['authorization']
  const { code: code1 } = jwt.verify(token.split(' ')[1], SECRET_KEY)
  const { code: code2 } = req.body
  if (Number(code1) !== Number(code2)) {
    res.send({
      code: -1,
      message: '验证码错误',
    })
  } else {
    res.send({
      code: 0,
      message: '验证码正确',
    })
  }
}

const addPassword = async (req, res, next) => {
  const token = req.headers['authorization']
  const { phone = '', email = '' } = jwt.verify(token.split(' ')[1], SECRET_KEY)
  const { password1, password2 } = req.body

  const userInfo = {
    id: v1().replace(/-/g, ''),
    email,
    phone,
    role: 3,
    password: md5(password1),
  }
  try {
    await add(userInfo)
    res.send({
      code: 0,
      message: '注册成功',
    })
  } catch (err) {
    console.log(err)
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
  // if (password1 !== password2) {
  //   return res.send({
  //     code: -1,
  //     message:
  //   })
  // }
}

module.exports = {
  login,
  getUserInfo,
  setUserInfo,
  addUser,
  getUserList,
  deleteUser,
  toggleUserState,
  sendCode,
  checkCode,
  addPassword,
}
