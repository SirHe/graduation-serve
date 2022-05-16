module.exports = (err, req, res, next) => {
  // log the error...
  res.sendStatus(err.httpStatusCode).json(err)
}
