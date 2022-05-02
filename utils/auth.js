const jwt = require('jsonwebtoken')
const { SECRET_KEY, AGING } = require('../config')

// function getTokenFromHeader(req) {
//   if (
//     (req.headers.authorization &&
//       req.headers.authorization.split(' ')[0] === 'Token') ||
//     (req.headers.authorization &&
//       req.headers.authorization.split(' ')[0] === 'Bearer')
//   ) {
//     return req.headers.authorization.split(' ')[1]
//   }

//   return null
// }

// const auth = {
//   required: jwt({
//     secret: SECRET_KEY,
//     algorithms: ['HS256'],
//     userProperty: 'payload',
//     getToken: getTokenFromHeader,
//   }),
//   optional: jwt({
//     secret: SECRET_KEY,
//     algorithms: ['HS256'],
//     userProperty: 'payload',
//     credentialsRequired: false,
//     getToken: getTokenFromHeader,
//   }),
// }

const getToken = (data) => {
  console.log(data)
  // 生成一个有效期为七天的凭证
  const token = jwt.sign(data, SECRET_KEY, {
    expiresIn: AGING,
  })
  console.log(token)
  return token
}

module.exports = {
  getToken,
}
