const router = require('express').Router()
const {
  addArticle,
  deleteArticle,
  alterArticle,
  getCategoryList,
  getDraftList,
  getAuditList,
  getArticleDetail,
  auditArticle,
  submitAudit,
  getArticleList,
  getPublishArticle,
  publishArticle,
  offlineArticle,
  getOfflineArticle,
  addArticleStar,
  deleteArticleStar,
  // addArticleCollect,
  // deleteArticleCollect,
  getCommentList,
  addComment,
} = require('../../service/article')
const { loginAuth, userAuth } = require('../../middleware/auth')

// 获取文章分类
router.get('/category', getCategoryList)

// 获取草稿箱文章
router.get('/draft', loginAuth, userAuth, getDraftList)

//获取待审核文章列表
router.get('/audit', loginAuth, userAuth, getAuditList)
// 审核文章
router.put('/audit', loginAuth, userAuth, auditArticle)
// 提交审核
router.post('/audit', loginAuth, userAuth, submitAudit)

// 获取发布文章列表
router.get('/publish', loginAuth, userAuth, getPublishArticle)
// 发布文章
router.put('/publish', loginAuth, userAuth, publishArticle)

// 下线文章
router.put('/offline', loginAuth, userAuth, offlineArticle)
// 获取下线文章列表
router.get('/offline', loginAuth, userAuth, getOfflineArticle)

// 文章点赞
router.post('/star', loginAuth, addArticleStar)
router.delete('/star', loginAuth, deleteArticleStar)

// // 文章收藏
// router.post('/collect', loginAuth, addArticleCollect)
// router.delete('/collect', loginAuth, deleteArticleCollect)

// 评论
router.get('/comment', getCommentList)
// 添加一个新评论
router.post('/comment', loginAuth, addComment)

//获取文章详情（这个需要放在最后，不然会造成路由误配）
router.get('/:id', loginAuth, getArticleDetail)
// 获取文章list
router.get('/', getArticleList)
// 添加文章
router.post('/', loginAuth, userAuth, addArticle)
// 删除文章
router.delete('/', loginAuth, userAuth, deleteArticle)
// 修改文章
router.put('/', loginAuth, userAuth, alterArticle)

module.exports = router
