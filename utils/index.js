// 必须引入crypto
const crypto = require('crypto')
const md5 = (data) => {
  // 以md5的格式创建一个哈希值
  const hash = crypto.createHash('md5')
  return hash.update(data).digest('base64')
}

const HS256 = (data) => {
  // 以md5的格式创建一个哈希值
  const hmac = crypto.createHmac('sha256', 'ujiuye')
  return hmac.update(data).digest('base64')
}

module.exports = {
  md5,
  HS256,
}
