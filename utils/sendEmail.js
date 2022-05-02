const nodemailer = require('nodemailer')

module.exports = (to, subject, html) => {
  const mailTransport = nodemailer.createTransport({
    host: 'smtp.aliyun.com',
    secureConnection: true, // use SSL
    port: 465,
    auth: {
      user: 'hemingguang@aliyun.com',
      pass: '(hmg)201101',
    },
  })

  const options = {
    from: 'hemingguang@aliyun.com',
    to,
    subject,
    html,
  }

  return new Promise((resolve, reject) => {
    mailTransport.sendMail(options, function (err, msg) {
      if (err) {
        reject(err)
      } else {
        resolve(msg)
      }
    })
  })
}
