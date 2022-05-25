const db = require('../db/mysql')

const getUserInfobyUsernameAndPassword = (username, password) => {
  return db
    .select('*')
    .from('user')
    .where('username', username)
    .where('password', password)
    .queryRow()
}

const getUserInfoById = (id) => {
  return db.select('*').from('user').where('id', id).queryRow()
}

const updateUserInfo = (id, userInfo) => {
  return db.update('user', userInfo).where('id', id).execute()
}

const getUserMenu = (id) => {
  return db
    .sql(
      `
      select
      DISTINCT
      m.url
      from 
      user u,
      user_role ur,
      menu_role mr,
      menu m
      where
      u.id = ur.user_id
      and
      ur.role_id = mr.role_id
      and 
      m.id = mr.menu_id
      and 
      u.id = '${id}'
    `
    )
    .execute()
}

const getUserRoles = (id) => {
  return db
    .sql(
      `
      select 
      u.id,
      r.name
      from
      user u,
      user_role ur,
      role r
      where
      u.id = ur.user_id
      and
      ur.role_id = r.id
      AND
      u.id = '${id}'
    `
    )
    .execute()
}

const getClientMenu = (id) => {
  return db
    .sql(
      `
      SELECT
      m.url
      FROM
      user u,
      role r,
      user_role ur,
      menu m,
      menu_role mr
      WHERE
      ur.user_id = u.id
      AND
      ur.role_id = r.id
      AND
      r.id = mr.role_id
      AND
      mr.menu_id = m.id
      AND
      m.type = 'client'
      AND
      u.id = '${id}'
  `
    )
    .execute()
}

const add = (userInfo) => {
  return db.insert('user', userInfo).execute()
}
const getList = (page, size) => {
  return db.select('*').from('user').queryListWithPaging(page, size)
}

const deleteUser = (id) => {
  return db.delete('user').where('id', id).execute()
}

const toggleUserState = (id, enabled) => {
  return db.update('user', { enabled }).where('id', id).execute()
}

module.exports = {
  getUserInfobyUsernameAndPassword,
  getUserInfoById,
  updateUserInfo,
  getUserMenu,
  getUserRoles,
  getClientMenu,
  add,
  getList,
  deleteUser,
  toggleUserState,
}
