const { env } = require('./env')
const UPLOAD_PATH = env === 'dev' ?
  '../../../nginx/upload/admin-upload-ebook' :
  '../../../nginx/upload/admin-upload-ebook'

const UPLOAD_URL = env === 'dev' ?
  'https://www.maiskao.com:18083/admin-upload-ebook/' :
  'https://www.maiskao.com:18083/admin-upload-ebook/'

module.exports = {
    CODE_ERROR: -1,
    CODE_SUCCESS: 0,
    CODE_TOKEN_EXPIRED: -2,
    debug: true,
    PWD_SALT: 'admin_imooc_node',
    PRIVATE_KEY: 'admin_node_maiskao.com',
    //PRIVATE_KEY: 'admin_imooc_node_test_youbaobao_xyz',
    JWT_EXPIRED: 60 * 60, // token失效时间
    UPLOAD_PATH,
    UPLOAD_URL,
    MIME_TYPE_EPUB: 'application/epub+zip'
    
  }