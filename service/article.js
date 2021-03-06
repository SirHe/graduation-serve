const multiparty = require('multiparty')
const path = require('path')
const fs = require('fs')
const { v1 } = require('uuid')
const {
  getCategoryAll,
  addArticle: addArticleM,
  getDraftList: getDraftListM,
  getAuditList: getAuditListM,
  getArticleDetail: getArticleDetailM,
  auditArticle: auditArticleM,
  submitAudit: submitAuditM,
  deleteArticle: deleteArticleM,
  getArticleList: getArticleListM,
  getPublishArticle: getPublishArticleM,
  publishArticle: publishArticleM,
  offlineArticle: offlineArticleM,
  getOfflineArticle: getOfflineArticleM,
  addStar,
  deleteStar,
  getStar,
  getCommentList: getCommentListM,
  addComment: addCommentM,
  searchArticle: searchArticleM,
  searchTips,
  addReport: addReportM,
  getReportList: getReportListM,
  deleteReport: deleteReportM,
  getSpecialList: getSpecialListM,
} = require('../models/article')

const getCategoryList = async (req, res, next) => {
  try {
    const arr = await getCategoryAll()
    const map = {}
    arr.forEach(({ id, name, childId, childName }) => {
      if (!map[id]) {
        map[id] = { id, name, children: [] }
      }
      if (childId) {
        map[id].children.push({
          id: childId,
          name: childName,
        })
      }
    })
    const categorys = Object.values(map)
    res.send({
      code: 0,
      message: '文章分类获取成功',
      data: categorys,
    })
  } catch (err) {
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const addArticle = async (req, res, next) => {
  const fromData = new multiparty.Form()
  fromData.parse(req, async (err, fields, files) => {
    const { title, auditState, category, content, summary, keywords } = fields
    const article = {
      id: v1().replace(/-/g, ''),
      title: title[0],
      summary: summary[0],
      author: req.user.id,
      audit_state: auditState[0],
      category: category[0],
      content: content[0],
      keywords: keywords[0],
    }
    if (files.coverFile) {
      // 保存图片
      const { path: filePath } = files.coverFile[0]
      const fileName = `${v1().replace(/-/g, '')}.${filePath.split('.').at(-1)}`
      const coverFile = fs.readFileSync(filePath)
      fs.writeFileSync(path.join(__dirname, `../public/${fileName}`), coverFile)
      article.cover = fileName
    }

    try {
      await addArticleM(article)
      res.send({
        code: 0,
        message: '文章添加成功',
      })
    } catch (err) {
      res.status(500).send({
        message: '服务器错误，请稍后重试',
      })
    }
  })
}

const alterArticle = () => {}

const getDraftList = async (req, res, next) => {
  const { id, isAdmin } = req.user
  const { page, size } = req.query
  // 如果是管理员，获取所有草稿箱的文章
  try {
    const { rows, total } = await getDraftListM(isAdmin ? '' : id, page, size)
    res.send({
      code: 0,
      message: '草稿箱文章获取成功',
      data: rows.map(({ id, nickname, avatar, title, create_time, name }) => ({
        id,
        title,
        author: nickname,
        avatar,
        category: name,
        create_time,
      })),
      total,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const getAuditList = async (req, res, next) => {
  const { id, isAdmin } = req.user
  const { page, size, isPending } = req.query
  try {
    const { rows, total } = await getAuditListM(
      isAdmin ? '' : id,
      page,
      size,
      JSON.parse(isPending)
    )
    res.send({
      code: 0,
      message: '审核文章列表获取成功',
      data: rows.map(
        ({ id, nickname, avatar, title, create_time, name, audit_state }) => ({
          id,
          title,
          author: nickname,
          avatar,
          category: name,
          create_time,
          audit_state,
        })
      ),
      total,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const auditArticle = async (req, res, next) => {
  const { id, result } = req.body
  try {
    await auditArticleM(id, result)
    res.send({
      code: 0,
      message: '文章审核成功',
    })
  } catch (error) {
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const submitAudit = async (req, res, next) => {
  const { id } = req.body
  try {
    await submitAuditM(id)
    res.send({
      code: 0,
      message: '文章提交审核成功',
    })
  } catch (error) {
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const deleteArticle = async (req, res, next) => {
  const { id: articleId } = req.body
  try {
    await deleteArticleM(articleId)
    res.send({
      code: 0,
      message: '删除文章成功',
    })
  } catch (error) {
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const getArticleDetail = async (req, res, next) => {
  const { id: articleId } = req.params
  const userId = req.user?.id || ''
  try {
    const article = await getArticleDetailM(articleId)
    const star = await getStar(articleId, userId)
    article.star = star
    res.send({
      code: 0,
      message: '文章详情获取成功',
      data: article,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const getArticleList = async (req, res, next) => {
  const { page, size, category } = req.query
  try {
    const { rows, total } = await getArticleListM(category, page, size)
    res.send({
      code: 0,
      message: '文章列表获取成功',
      data: rows,
      total,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const getPublishArticle = async (req, res, next) => {
  const { id, isAdmin } = req.user
  const { page, size, isPublished } = req.query
  try {
    const { rows, total } = await getPublishArticleM(
      isAdmin ? '' : id,
      JSON.parse(isPublished),
      page,
      size
    )
    res.send({
      code: 0,
      message: `${
        JSON.parse(isPublished) ? '已发布' : '待发布'
      }文章列表获取成功`,
      data: rows.map(({ id, nickname, avatar, title, create_time, name }) => ({
        id,
        title,
        author: nickname,
        avatar,
        category: name,
        create_time,
      })),
      total,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const publishArticle = async (req, res, next) => {
  const { id } = req.body
  try {
    await publishArticleM(id)
    res.send({
      code: 0,
      message: '文章发布成功',
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const offlineArticle = async (req, res, next) => {
  const { id } = req.body
  try {
    await offlineArticleM(id)
    res.send({
      code: 0,
      message: '文章下线成功',
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const getOfflineArticle = async (req, res, next) => {
  const { id, isAdmin } = req.user
  const { page, size } = req.query
  try {
    const { rows, total } = await getOfflineArticleM(
      isAdmin ? '' : id,
      page,
      size
    )
    res.send({
      code: 0,
      message: '已下线文章列表获取成功',
      data: rows.map(
        ({ id, nickname, avatar, title, create_time, name, audit_state }) => ({
          id,
          title,
          author: nickname,
          avatar,
          category: name,
          create_time,
          audit_state,
        })
      ),
      total,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

// 文章点赞
const addArticleStar = async (req, res, next) => {
  const { id: userId } = req.user
  const { id: articleId } = req.body
  try {
    await addStar(userId, articleId)
    res.send({
      code: 0,
      message: '文章点赞成功',
    })
  } catch (err) {
    const error = new Error('服务器错误，请稍后重试')
    error.httpStatusCode = 500
    return next(error)
  }
}
const deleteArticleStar = async (req, res, next) => {
  const { id: userId } = req.user
  const { id: articleId } = req.body
  try {
    await deleteStar(userId, articleId)
    res.send({
      code: 0,
      message: '文章取消点赞成功',
    })
  } catch (err) {
    const error = new Error('服务器错误，请稍后重试')
    error.httpStatusCode = 500
    return next(error)
  }
}

// const addArticleCollect = async (req, res, next) => {}

// const deleteArticleCollect = async (req, res, next) => {}

const getCommentList = async (req, res, next) => {
  const { id, page, size } = req.query
  try {
    const { data, total } = await getCommentListM(id, page, size)
    res.send({
      code: 0,
      message: '评论数据获取成功',
      data,
      total,
    })
  } catch (err) {
    const error = new Error('服务器错误，请稍后重试')
    error.httpStatusCode = 500
    return next(error)
  }
}

const addComment = async (req, res, next) => {
  const { id: userId } = req.user
  const { recipient, comment, parentId } = req.body
  const commentObj = {
    id: v1().replace(/-/g, ''),
    author: userId,
    recipient,
    comment,
    parent_id: parentId,
    create_time: new Date().toISOString(),
  }
  try {
    await addCommentM(commentObj)
    res.send({
      code: 0,
      message: '评论成功',
    })
  } catch (err) {
    const error = new Error('服务器错误，请稍后重试')
    error.httpStatusCode = 500
    return next(error)
  }
}

const searchArticle = async (req, res, next) => {
  const { key, isTips, order } = req.query
  let data = []
  try {
    if (JSON.parse(isTips)) {
      data = await searchTips(key)
    } else {
      data = await searchArticleM(key, order)
    }
    res.send({
      code: 0,
      data,
      // message: '评论成功',
    })
  } catch (err) {
    const error = new Error('服务器错误，请稍后重试')
    error.httpStatusCode = 500
    return next(error)
  }
}

const addReport = async (req, res, next) => {
  const { id } = req.user
  const { reported, reason, tableName } = req.body
  console.log(reported, id, reason, tableName)
  const reportInfo = {
    id: v1().replace(/-/g, ''),
    report: id,
    reported,
    reason,
    table_name: tableName,
  }
  try {
    await addReportM(reportInfo)
    res.send({
      code: 0,
      message: '举报成功',
    })
  } catch (err) {
    const error = new Error('服务器错误，请稍后重试')
    error.httpStatusCode = 500
    return next(error)
  }
}

const getReportList = async (req, res, next) => {
  const { page, size } = req.query
  try {
    const { rows, total } = await getReportListM(page, size)
    res.send({
      code: 0,
      data: rows,
      total,
      message: '举报列表获取成功',
    })
  } catch (err) {
    const error = new Error('服务器错误，请稍后重试')
    error.httpStatusCode = 500
    return next(error)
  }
}

const deleteReport = async (req, res, next) => {
  try {
    await deleteReportM(req.body.id)
    res.send({
      code: 0,
      message: '举报删除成功',
    })
  } catch (err) {
    const error = new Error('服务器错误，请稍后重试')
    error.httpStatusCode = 500
    return next(error)
  }
}

const getSpecialList = async (req, res, next) => {
  const type = req.query.type
  if (type === 'carousel') {
    const { rows } = await getSpecialListM('create_time')
    return res.send({
      code: 0,
      data: rows,
      message: '轮播图文章获取成功',
    })
  } else if (type === 'new') {
    const { rows } = await getSpecialListM('create_time')
    return res.send({
      code: 0,
      data: rows,
      message: '最新文章获取成功',
    })
  } else {
    const { rows } = await getSpecialListM('pageviews')
    return res.send({
      code: 0,
      data: rows,
      message: '最受欢迎文章获取成功',
    })
  }
}

module.exports = {
  getCategoryList,
  addArticle,
  deleteArticle,
  getDraftList,
  getAuditList,
  getArticleDetail,
  auditArticle,
  submitAudit,
  getPublishArticle,
  getArticleList,
  alterArticle,
  publishArticle,
  offlineArticle,
  getOfflineArticle,
  addArticleStar,
  deleteArticleStar,
  // addArticleCollect,
  // deleteArticleCollect,
  getCommentList,
  addComment,
  searchArticle,
  addReport,
  getReportList,
  deleteReport,
  getSpecialList,
}
