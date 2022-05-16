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

module.exports = {
  getUserInfobyUsernameAndPassword,
  getUserInfoById,
  updateUserInfo,
  getUserMenu,
  getUserRoles,
}
