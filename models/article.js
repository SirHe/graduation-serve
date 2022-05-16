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
  // 文章id做key
  await redisClient.sAdd(article_id, user_id)
}

const deleteStar = async (user_id, article_id) => {
  await redisClient.sRem(article_id, user_id)
}

const getStar = async (articleId, userId) => {
  const count = await redisClient.sCard(articleId)
  if (count <= 0) {
    // 如果没有，则去mysql数据库拉取数据
    const data = await db
      .select('*')
      .from('article_star')
      .where('article_id', articleId)
      .queryList()
    // 同步redis
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
  // 获取全部文章评论列表
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
  // 分页
  const list = articleCommentList.slice((page - 1) * size, page * size)
  // // 获取文章的评论
  // const comments = list.map(async (item) => {
  //   const comment = await redisClient.hGetAll(`article-comment-${item}`)
  //   const arr = []
  //   // 默认获取两条子评论
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
    // 默认获取两条子评论
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

  // 回复评论的评论
  if (comment.recipient) {
    Object.entries(comment).forEach(([key, value]) => {
      redisClient.hSet(`reply-comment-${comment.id}`, key, value ?? '')
    })
    // 保存回复list，方便获取list
    redisClient.rPush(`reply-comment-list-${comment.parent_id}`, comment.id)
  } else {
    Object.entries(comment).forEach(([key, value]) => {
      redisClient.hSet(`article-comment-${comment.id}`, key, value ?? '')
    })
    // 保存回复list，方便获取list
    redisClient.rPush(`article-comment-list-${comment.parent_id}`, comment.id)
  }
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
}
