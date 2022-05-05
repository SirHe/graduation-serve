const db = require('../utils/MySQL')('graduation_serve')

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

const getAduitList = (page, size) => {
  return db
    .select('a.id, u.nickname, u.avatar, a.title, a.create_time, ac.name')
    .from('article a')
    .join('LEFT JOIN user u ON u.id = a.author')
    .join('LEFT JOIN article_category ac ON ac.id = a.category')
    .where('a.publish_state', 0)
    .where('a.audit_state', 1)
    .queryListWithPaging(page, size)
}

const deleteArticle = (id) => {}

module.exports = {
  getCategoryAll,
  addArticle,
  deleteArticle,
  getDraftList,
  getAduitList,
}
