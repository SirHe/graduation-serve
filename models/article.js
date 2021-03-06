const db = require('../db/mysql')
const redisClient = require('../db/redis')
const {
  synchronizeCommentToRedis,
  synchronizeUserToRedis,
  synchronizeCommentToMySQL,
} = require('./module/synchronousData')

const getCategoryAll = () => {
  return db
    .select(
      'ac1.*, ac2.id  childId, ac2.`name` childName, ac2.parent_id childParentId'
    )
    .from('article_category as ac1')
    .join('left join article_category as ac2 on ac1.id  = ac2.parent_id')
    .where('ac1.parent_id', 0)
    .queryList()
}

const addArticle = (article) => {
  return db.insert('article', article).execute()
}

const getDraftList = (authorId, page, size) => {
  return db
    .select('a.id, u.nickname, u.avatar, a.title, a.create_time, ac.name')
    .from('article a')
    .join('LEFT JOIN user u ON u.id = a.author')
    .join('LEFT JOIN article_category ac ON ac.id = a.category')
    .where('a.publish_state', 0)
    .where('a.audit_state', 0)
    .where('a.author', authorId, 'like')
    .queryListWithPaging(page, size)
}

const getAuditList = (authorId, page, size, isPending) => {
  const dbObj = db
    .select(
      'a.id, u.nickname, u.avatar, a.title, a.create_time, ac.name, a.audit_state'
    )
    .from('article a')
    .join('LEFT JOIN user u ON u.id = a.author')
    .join('LEFT JOIN article_category ac ON ac.id = a.category')
    .where('a.publish_state', 0)
    .where('a.author', authorId, 'like')
  return isPending
    ? dbObj.where('a.audit_state', 1).queryListWithPaging(page, size)
    : dbObj.where('a.audit_state', 0, 'gt').queryListWithPaging(page, size)
}

const auditArticle = (id, result) => {
  return db
    .update('article', { audit_state: result ? 2 : 3 })
    .where('id', id)
    .execute()
}

const submitAduit = (id) => {
  return db.update('article', { audit_state: 1 }).where('id', id).execute()
}

const deleteArticle = (id) => {
  return db.delete('article').where('id', id).execute()
}

const getArticleDetail = (id) => {
  return db
    .select(
      'a.*, u.id author_id, u.nickname author_name, u.brief author_brief, u.avatar author_avatar'
    )
    .from('article a')
    .join('LEFT JOIN user u ON a.author = u.id')
    .where('a.id', id)
    .queryRow()
}

const getArticleList = (category, page, size) => {
  return db
    .select('*')
    .from('article')
    .where('publish_state', 1)
    .where('audit_state', 2)
    .where('category', category)
    .queryListWithPaging(page, size)
}

const getPublishArticle = (authorId, isPublished, page, size) => {
  return db
    .select('a.id, u.nickname, u.avatar, a.title, a.create_time, ac.name')
    .from('article a')
    .join('LEFT JOIN user u ON u.id = a.author')
    .join('LEFT JOIN article_category ac ON ac.id = a.category')
    .where('a.publish_state', isPublished ? 1 : 0)
    .where('a.audit_state', 2)
    .where('a.author', authorId, 'like')
    .queryListWithPaging(page, size)
}

const publishArticle = (id) => {
  return db.update('article', { publish_state: 1 }).where('id', id).execute()
}

const offlineArticle = (id) => {
  return db.update('article', { publish_state: 2 }).where('id', id).execute()
}

const getOfflineArticle = (authorId, page, size) => {
  return db
    .select('a.id, u.nickname, u.avatar, a.title, a.create_time, ac.name')
    .from('article a')
    .join('LEFT JOIN user u ON u.id = a.author')
    .join('LEFT JOIN article_category ac ON ac.id = a.category')
    .where('a.publish_state', 2)
    .where('a.audit_state', 2)
    .where('a.author', authorId, 'like')
    .queryListWithPaging(page, size)
}

const addStar = async (user_id, article_id) => {
  // ??????id???key
  await redisClient.sAdd(article_id, user_id)
}

const deleteStar = async (user_id, article_id) => {
  await redisClient.sRem(article_id, user_id)
}

const getStar = async (articleId, userId) => {
  const count = await redisClient.sCard(articleId)
  if (count <= 0) {
    // ?????????????????????mysql?????????????????????
    const data = await db
      .select('*')
      .from('article_star')
      .where('article_id', articleId)
      .queryList()
    // ??????redis
    data.forEach(({ user_id }) => {
      redisClient.sAdd(articleId, user_id)
    })

    return {
      isStar: data.some((item) => item.user_id === userId),
      count: data.length,
    }
  }
  return {
    isStar: await redisClient.SISMEMBER(articleId, userId),
    count,
  }
}

const getCommentList = async (id, page, size) => {
  // ??????????????????????????????
  const articleCommentList = await redisClient.lRange(
    `article-comment-list-${id}`,
    0,
    -1
  )
  const total = articleCommentList.length
  if (total === 0) {
    synchronizeCommentToRedis()
    synchronizeUserToRedis()
  }
  // ??????
  const list = articleCommentList.slice((page - 1) * size, page * size)
  // // ?????????????????????
  // const comments = list.map(async (item) => {
  //   const comment = await redisClient.hGetAll(`article-comment-${item}`)
  //   const arr = []
  //   // ???????????????????????????
  //   for (let i = 0; i < 2; i++) {
  //     const childComment = await redisClient.hGetAll(
  //       `reply-comment-${comment.id}`
  //     )
  //     arr.push(childComment)
  //   }
  //   comment.children = arr
  //   return comment
  // })
  const comments = []
  for (let x = 0; x < list.length; x++) {
    const comment = await redisClient.hGetAll(`article-comment-${list[x]}`)
    const replyList = await redisClient.lRange(
      `reply-comment-list-${list[x]}`,
      0,
      1
    )
    const arr = []
    // ???????????????????????????
    for (let i = 0; i < replyList.length; i++) {
      const childComment = await redisClient.hGetAll(
        `reply-comment-${replyList[i]}`
      )
      arr.push(childComment)
    }
    comment.children = arr
    comments.push(comment)
  }
  return {
    data: comments,
    total,
  }
}

const addComment = async (comment) => {
  // synchronizeCommentToMySQL()
  comment = {
    ...comment,
    star: 0,
    author_id: comment.author,
    recipient_id: comment.recipient,
    author_nickname: await redisClient.hGet(
      `user-${comment.author}`,
      'nickname'
    ),
    author_avatar: await redisClient.hGet(`user-${comment.author}`, 'avatar'),
    recipient_nickname: await redisClient.hGet(
      `user-${comment.recipient}`,
      'nickname'
    ),
  }

  // ?????????????????????
  if (comment.recipient) {
    Object.entries(comment).forEach(([key, value]) => {
      redisClient.hSet(`reply-comment-${comment.id}`, key, value ?? '')
    })
    // ????????????list???????????????list
    redisClient.rPush(`reply-comment-list-${comment.parent_id}`, comment.id)
  } else {
    Object.entries(comment).forEach(([key, value]) => {
      redisClient.hSet(`article-comment-${comment.id}`, key, value ?? '')
    })
    // ????????????list???????????????list
    redisClient.rPush(`article-comment-list-${comment.parent_id}`, comment.id)
  }
}

const searchArticle = (key, order) => {
  return db.select('*').from('article').where('title', key, 'like').queryList()
}

const searchTips = (key) => {
  return db
    .select('id,title')
    .from('article')
    .where('title', key, 'like')
    .queryList()
}

const addReport = (reportInfo) => {
  return db.insert('article_report', reportInfo).execute()
}

const getReportList = async (page, size) => {
  const list1 = await db
    .sql(
      `
  SELECT
  DISTINCT
  ar.id,
  u1.nickname report,
  u2.id reported_id,
  u2.nickname reported,
  ac.comment content,
  ar.reason
  FROM
  article_report ar,
  user u1,
  user u2,
  article_comment ac
  WHERE
  ar.report = u1.id
  AND
  ar.reported = ac.id
  AND
  ac.author = u2.id
  `
    )
    .execute()
  const list2 = await db
    .sql(
      `
  SELECT
  DISTINCT
  ar.id,
  u1.nickname report,
  u2.id reported_id,
  u2.nickname reported,
  a.title content,
  ar.reason
  FROM
  article_report ar,
  user u1,
  user u2,
  article a
  WHERE
  ar.report = u1.id
  AND
  ar.reported = a.id
  AND
  a.author = u2.id
  `
    )
    .execute()
  const list = [...list1, ...list2]
  return {
    rows: list.slice((page - 1) * size, page * size),
    total: list.length,
  }
}

const deleteReport = (id) => {
  return db.delete('article_report').where('id', id).execute()
}

const getSpecialList = (order) => {
  return db
    .select('*')
    .from('article')
    .orderby(`${order} desc`)
    .queryListWithPaging(1, 5)
}

module.exports = {
  getCategoryAll,
  addArticle,
  deleteArticle,
  getDraftList,
  getAuditList,
  getArticleDetail,
  auditArticle,
  submitAduit,
  getArticleList,
  getPublishArticle,
  publishArticle,
  offlineArticle,
  getOfflineArticle,
  addStar,
  deleteStar,
  getStar,
  getCommentList,
  addComment,
  searchArticle,
  searchTips,
  addReport,
  getReportList,
  deleteReport,
  getSpecialList,
}
