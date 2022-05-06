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
}
