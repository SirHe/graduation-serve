const router = require('express').Router()
const { getUserInfobyUsernameAndPassword } = require('../../models/user')
const { getToken } = require('../../utils/auth')

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body
  if (!username) {
    return res.status(422).json({ errors: { username: '不能空白' } })
  }

  if (!password) {
    return res.status(422).json({ errors: { password: '不能空白' } })
  }

  try {
    const { id } = await getUserInfobyUsernameAndPassword(username, password)
    res.send({
      code: 0,
      msg: '登录成功！',
      data: {
        tokenHead: 'Bearer',
        token: getToken({ id }),
      },
    })
  } catch (err) {
    res.send({
      code: 1,
      msg: '账号或者密码错误',
    })
  }
})

module.exports = router
