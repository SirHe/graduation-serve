const corsOptions = {
  origin: 'http://www.hmghome.top:8080',
  optionsSuccessStatus: 200,
}

const SECRET_KEY = 'test123'

const AGING = 60 * 60 * 24 * 7

module.exports = {
  corsOptions,
  SECRET_KEY,
  AGING,
}
