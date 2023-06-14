const _ = require('lodash')
const db = require('../db')
const Book = require('../models/Book')
const { debug } = require('../utils/constant')

function exists(book) {
  const { title, author, publisher } = book
  const sql = `select * from book where title='${title}' and author='${author}' and publisher='${publisher}'`
  return db.queryOne(sql)
}

async function removeBook(book) {
  if (book) {
    book.reset()
    if (book.fileName) {
      const removeBookSql = `delete from book where fileName='${book.fileName}'`
      const removeContentsSql = `delete from contents where fileName='${book.fileName}'`
      await db.querySql(removeBookSql)
      await db.querySql(removeContentsSql)
    }
  }
}

async function insertContents(book){
  const contents = book.getContents()
  if(contents && contents.length > 0){
    for(let i = 0; i < contents.length; i++){
      const content = contents[i]
      const _content = _.pick(content, [
        'fileName',
        'id',
        'href',
        'text',
        'order',
        'level',
        'label',
        'pid',
        'navId'
      ])
      console.log('_content', _content)
      // _content内容将插入数据库contents表中
      await db.insert(_content, 'contents')
    }
  }
}

function insertBook(book){
  return new Promise(async (resolve, reject) => {
    try{
      // 判断book参数是否为Book对像中的一个实例
      if(book instanceof Book){
        const result = await exists(book)
        // 判断电子书是否存在
        if(result){
          // 移除
          await removeBook(book)
          reject(new Error('电子书已存在'))
        } else {
          // 新增电子书await db.insert(对象实例, 表名)
          await db.insert(book.toDb(), 'book')
          // 电子书目录数据库创建
          await insertContents(book)
          resolve()
        }
      }else{
        reject(new Error('添加的图书对象不合法'))
      }
    } catch (e) {
      reject (e)
    }
  })
}

function getBook(fileName){
  return new Promise(async (resolve,reject) => {
    const bookSql = `select * from book where fileName='${fileName}'`
    const contentsSql = `select * from contents where fileName='${fileName}' order by \`order\``
    const book = await db.queryOne(bookSql)
    const contents = await db.querySql(contentsSql)
     if (book) {
      book.cover = Book.genCoverUrl(book)
      book.contentsTree = Book.genContentsTree(contents)
      resolve(book)
    } else {
      reject(new Error('电子书不存在'))
     }
  })
}

function updateBook(book){
  return new Promise(async ( resolve, reject ) => {
    try{
      if( book instanceof Book ){
        const result = await getBook(book.fileName)
        if(result){
          const model = book.toDb()
          if(+result.updateType === 0){
            reject(new Error('内置图书不能编辑'))
          }else{
            // model和表名book和条件
            await db.update(model, 'book', `where fileName='${book.fileName}'`)
            resolve()
          }
        }        
      } else {
        reject(new Error('添加的图书对象不合法'))
      }
    } catch(e){
      reject(e)
    }
  })
}

async function getCategory() {
  const sql = 'select * from category order by category asc'
  const result = await db.querySql(sql)
  const categoryList = []
  result.forEach(item => {
    categoryList.push({
      label: item.categoryText,
      value: item.category,
      num: item.num
    })
  })
  return categoryList
}

async function listBook (query){
  debug && console.log('query', query)
  const {
    category,
    author,
    title,
    sort,
    page = 1,
    pageSize = 20
  } = query
  const offset = (page - 1) * pageSize
  let bookSql = 'select * from book'
  let where = 'where'
  title && (where = db.andLike(where, 'title', title))
  author && (where = db.andLike(where, 'author', author))
  category && (where = db.and(where, 'categoryText', category))
  if(where !== 'where'){
     bookSql =`${bookSql} ${where}`
  }
  // 排序
  if(sort){
    const symbol = sort[0]
    const column = sort.slice(1, sort.length)
    const order = symbol === '+' ? 'asc' : 'desc'
    bookSql = `${bookSql} order by \`${column}\` ${order}`
  }
  // 分页
  let countSql = `select count(*) as count from book`
  if(where !== 'where'){
    countSql = `${countSql} ${where}`
  }
  const count = await db.querySql(countSql)
  bookSql =`${bookSql} limit ${pageSize} offset ${offset}`
  const list = await db.querySql(bookSql)
  // 数据列表图片显示异常处理
  list.forEach(book => book.cover = Book.genCoverUrl(book))
  return { list, count: count[0].count, page, pageSize }
  // return new Promise((resolve, reject)=>{
  //   resolve(list)
  // })
}

function deleteBook(fileName) {
  return new Promise(async (resolve, reject) => {
    // resolve()
    let book = await getBook(fileName)
    if (book) {
      if (+book.updateType === 0) {
        reject(new Error('内置电子书不能删除'))
      } else {
        const bookObj = new Book(null, book)
        const sql = `delete from book where fileName='${fileName}'`
        db.querySql(sql).then(() => {
          // 调用reset方法删除电子相关文件
          bookObj.reset()
          resolve()
        })
      }
    } else {
      reject(new Error('电子书不存在'))
    }
  })
}

function home() {
  const userSql = 'select count(*) as count from user'
  const bookSql = 'select count(*) as count from book'
  const shelfSql = 'select count(*) as count from shelf'
  // const rankSql = 'select count(*) as count from rank'
  const rankSql = 'select count(*) as count from `rank`'
  return Promise.all([
    db.querySql(userSql),
    db.querySql(bookSql),
    db.querySql(shelfSql),
    db.querySql(rankSql)
  ]).then(results =>{
    const user = results[0][0].count
    const book = results[1][0].count
    const shelf = results[2][0].count
    const rank = results[3][0].count
    return { user, book, shelf, rank }
  }) 
}

module.exports = {
  insertBook,
  getBook,
  updateBook,
  getCategory,
  listBook,
  deleteBook,
  home
  
}
