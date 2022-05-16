const corsOptions = {
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  optionsSuccessStatus: 200,
}

const SECRET_KEY = 'test123'

const AGING = 60 * 60 * 24 * 7

const WHITE_LIST = [
  {
    method: 'GET',
    url: '/article/',
  },
]

module.exports = {
  corsOptions,
  SECRET_KEY,
  AGING,
  WHITE_LIST,
}
