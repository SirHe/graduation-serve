const router = require('express').Router()
const { login, getUserInfo, setUserInfo } = require('../../service/user')
const { loginAuth } = require('../../middleware/auth')

router.post('/login', login)

router.get('/info', loginAuth, getUserInfo)

router.post('/info', loginAuth, setUserInfo)

module.exports = router
