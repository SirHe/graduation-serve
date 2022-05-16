const DbClient = require('ali-mysql-client')
const { MySQL_CONF } = require('../config/db')

const { host, user, password, database } = MySQL_CONF
const db = new DbClient({
  host,
  user,
  password,
  database,
})

module.exports = db
