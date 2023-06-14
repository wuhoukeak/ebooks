const express = require('express')
const Result = require('../models/Result')
const {login, findUser} = require('../services/user')
const { md5, decoded} = require('../utils')
const {PWD_SALT, PRIVATE_KEY, JWT_EXPIRED} = require('../utils/constant')
const { body, validationResult } = require('express-validator')
const boom = require('boom')
const jwt = require('jsonwebtoken')

const router = express.Router()

router.post(
  '/login',[
    body('username').isString().withMessage('用户名必须为字符'),
    body('password').isString().withMessage('密码必须为字符')
  ] ,
  function(req, res){
    const err = validationResult(req);
    if(!err.isEmpty()){
      const msg = err.errors[0].msg //const [{ msg }] = err.errors
      next(boom.badRequest(msg))
    } else {
      let { username, password } = req.body
      //const username = req.body.username
      //const password = req.body.password
      password = md5(`${req.body.password}${PWD_SALT}`) //md5加密码

      login(username, password).then(user => {
        if (!user || user.length === 0){
          new Result('登录失败').fail(res)
        } else {
          const token = jwt.sign(
            { username },
            PRIVATE_KEY,
            { expiresIn: JWT_EXPIRED }
          )
          new Result({ token }, '登录成功').success(res)
        }
      })
    }
  }
)

router.get('/info', function(req, res) {
  const decode = decoded(req)
  //console.log(decode)
  if(decode && decode.username){
    findUser(decode.username).then(user => {
      //console.log(user)
      if (user) {
        user.roles = [user.role]
        new Result(user, '用户信息查询成功！').success(res)
      } else {
        new Result('用户信息查询失败').fail(res)
      }
    })
  } else {
    new Result('用户信息查询失败').fail(res)
  }
  
})

module.exports = router