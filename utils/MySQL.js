const { connectDataBase } = require('../config/MySQL')
const DbClient = require('ali-mysql-client')

module.exports = (dataBase) => {
  return new DbClient(connectDataBase(dataBase))
}
