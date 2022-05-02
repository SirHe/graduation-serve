const db = require('../utils/MySQL')('graduation_serve')
const { md5 } = require('../utils')

const getUserInfobyUsernameAndPassword = (username, password) => {
  return db
    .select('*')
    .from('user')
    .where('username', username)
    .where('password', md5(password))
    .queryRow()
}

const getUserInfo = (id) => {}

module.exports = {
  getUserInfobyUsernameAndPassword,
  getUserInfo,
}
