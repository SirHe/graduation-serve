module.exports = {
  connectDataBase(dataBase) {
    // 数据库存连接配置
    return {
      // host
      host: '47.110.224.195',
      // 端口号
      port: '3306',
      // 用户名
      user: 'root',
      // 密码
      password: '201101',
      // 数据库名
      database: dataBase,
    }
  },
}
