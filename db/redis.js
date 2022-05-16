const redis = require('redis')
const { REDIS_CONF } = require('../config/db')

const { port, host } = REDIS_CONF
const client = redis.createClient({
  url: `redis://${host}:${port}`,
})
client.on('error', (err) => {
  console.error(err)
})
client.connect()

module.exports = client
