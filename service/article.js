const multiparty = require('multiparty')
const path = require('path')
const fs = require('fs')
const { v1 } = require('uuid')
const {
  getCategoryAll,
  addArticle: addArticleM,
  getDraftList: getDraftListM,
  getAduitList: getAduitListM,
} = require('../models/article')

const getCategoryList = async (req, res, next) => {
  try {
    const arr = await getCategoryAll()
    const map = {}
    arr.forEach(({ id, name, childId, childName }) => {
      if (!map[id]) {
        map[id] = { id, name, children: [] }
      }
      if (childId) {
        map[id].children.push({
          id: childId,
          name: childName,
        })
      }
    })
    const categorys = Object.values(map)
    res.send({
      code: 0,
      message: '文章分类获取成功',
      data: categorys,
    })
  } catch (err) {
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const addArticle = async (req, res, next) => {
  const fromData = new multiparty.Form()
  fromData.parse(req, async (err, fields, files) => {
    const { title, auditState, category, content, summary, keywords } = fields
    const article = {
      id: v1().replace(/-/g, ''),
      title: title[0],
      summary: summary[0],
      author: req.user.id,
      audit_state: auditState[0],
      category: category[0],
      content: content[0],
      keywords: keywords[0],
    }
    if (files.coverFile) {
      // 保存图片
      const { path: filePath } = files.coverFile[0]
      const fileName = `${v1().replace(/-/g, '')}.${filePath.split('.').at(-1)}`
      const coverFile = fs.readFileSync(filePath)
      fs.writeFileSync(path.join(__dirname, `../public/${fileName}`), coverFile)
      article.cover = fileName
    }

    try {
      await addArticleM(article)
      res.send({
        code: 0,
        message: '文章添加成功',
      })
    } catch (err) {
      res.status(500).send({
        message: '服务器错误，请稍后重试',
      })
    }
  })
}

const getDraftList = async (req, res, next) => {
  const { id, isAdmin } = req.user
  const { page, size } = req.query
  // 如果是管理员，获取所有草稿箱的文章
  try {
    const draftList = await getDraftListM(isAdmin ? '' : id, page, size)
    res.send({
      code: 0,
      message: '草稿箱文章获取成功',
      data: draftList.rows.map(
        ({ id, nickname, avatar, title, create_time, name }) => ({
          id,
          title,
          author: nickname,
          avatar,
          category: name,
          create_time,
        })
      ),
      total: draftList.total,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const getAduitList = async (req, res, next) => {
  const { page, size } = req.query
  try {
    const aduitList = await getAduitListM(page, size)
    res.send({
      code: 0,
      message: '待审核文章获取成功',
      data: aduitList.rows.map(
        ({ id, nickname, avatar, title, create_time, name }) => ({
          id,
          title,
          author: nickname,
          avatar,
          category: name,
          create_time,
        })
      ),
      total: aduitList.total,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: '服务器错误，请稍后重试',
    })
  }
}

const deleteArticle = (req, res, next) => {
  const { id: articleId } = req.body
  console.log(articleId)
}

module.exports = {
  getCategoryList,
  addArticle,
  deleteArticle,
  getDraftList,
  getAduitList,
}
