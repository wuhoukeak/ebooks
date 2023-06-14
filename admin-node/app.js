const express = require('express')
const router = require('./router')
const fs = require('fs')
const https = require('https')
const bodyParser = require('body-parser')
const cors = require('cors')

// 创建 express 应用
const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use('/',router)

const privateKey = fs.readFileSync('./https/maiskao.com.key')
const pem = fs.readFileSync('./https/maiskao.com_bundle.pem')
const credentials = {
  key: privateKey,
  cert: pem
}
const httpsServer = https.createServer(credentials,app)

// 使 express 监听 5000 端口号发起的 http 请求
const server = app.listen(5000, function() {
  const { address, port } = server.address()
  console.log('Http服务器启动成功: http://%s:%s', address, port)
})

httpsServer.listen(18082,function(){
  console.log('HTTPS Server is running on: https://www.maiskao.com:%s', 18082)
})