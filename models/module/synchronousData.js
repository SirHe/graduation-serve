const db = require('../../db/mysql')
const redisClient = require('../../db/redis')

// 将MySQL数据同步到redis中
const synchronizeCommentToRedis = async () => {
  const comments = await db
    .sql(
      `
      SELECT
      ac.*,
      u1.id author_id,
      u1.nickname author_nickname,
      u1.avatar author_avatar,
      u2.id recipient_id,
      u2.nickname recipient_nickname
      FROM
      (article_comment ac,
      user u1)
      LEFT JOIN
      user u2
      ON ac.recipient = u2.id
      WHERE
      ac.author = u1.id
  `
    )
    .execute()
  comments.forEach((comment) => {
    // 没有recipient的评论说明是评论文章的评论
    if (comment.recipient.trim() === '') {
      Object.entries(comment).forEach(([key, value]) => {
        redisClient.hSet(`article-comment-${comment.id}`, key, value ?? '')
      })
      // 保存文章评论，方便获取list
      redisClient.rPush(`article-comment-list-${comment.parent_id}`, comment.id)
    } else {
      // 评论下面的子评论
      Object.entries(comment).forEach(([key, value]) => {
        redisClient.hSet(`reply-comment-${comment.id}`, key, value ?? '')
      })
      // 保存回复list，方便获取list
      redisClient.rPush(`reply-comment-list-${comment.parent_id}`, comment.id)
    }
  })
}

const synchronizeStarToRedis = () => {}

const synchronizeUserToRedis = async () => {
  const userList = await db.select('*').from('user').queryList()
  userList.forEach((user) => {
    Object.entries(user).forEach(([key, value]) => {
      redisClient.hSet(`user-${user.id}`, key, value ?? '')
    })
  })
}

// 将redis comment 数据同步回MySQL
const synchronizeCommentToMySQL = async () => {
  // 查出所有MySQL中的comment数据
  const mysqlComments = await db.select('*').from('article_comment').queryList()
  // const list1 = await redisClient.lRange('article-comment-list', 0, -1)
  console.log(mysqlComments)
}

module.exports = {
  synchronizeCommentToRedis,
  synchronizeStarToRedis,
  synchronizeUserToRedis,
  synchronizeCommentToMySQL,
}
