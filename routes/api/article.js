const router = require('express').Router()
const {
  addArticle,
  deleteArticle,
  getCategoryList,
  getDraftList,
  getAduitList,
} = require('../../service/article')
const { loginAuth, userAuth } = require('../../middleware/auth')

// 获取文章分类
router.get('/category', getCategoryList)

// 获取草稿箱文章
router.get('/draft', loginAuth, userAuth, getDraftList)

// 添加文章
router.post('/add', loginAuth, userAuth, addArticle)

// 删除文章
router.post('/delete', loginAuth, userAuth, deleteArticle)

//获取待审核文章
router.get('/aduit', loginAuth, userAuth, getAduitList)

module.exports = router
