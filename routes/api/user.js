const router = require('express').Router()
const {
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
} = require('../../service/user')
const { loginAuth, userAuth } = require('../../middleware/auth')

router.post('/login', login)

router.get('/info', loginAuth, getUserInfo)

router.post('/info', loginAuth, setUserInfo)

// 添加用户
router.post('/add', loginAuth, userAuth, addUser)

// 获取用户list
router.get('/', loginAuth, getUserList)
router.delete('/', loginAuth, deleteUser)

router.post('/sendCode', sendCode)
router.post('/checkCode', checkCode)
router.post('/addPassword', addPassword)

router.put('/state', loginAuth, toggleUserState)

module.exports = router
