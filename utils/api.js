const HTTP_HOST = 'https://xbxunjian.17letao.cn'
const API_HOST = HTTP_HOST + '/api/'
const DEBUG = false
const IMG_HOST = DEBUG ? '' : HTTP_HOST
function phpRequest(requestParam) {
  var url = requestParam.url
  requestParam.url = API_HOST + url
  if (!requestParam.header) {
    requestParam.header = {
      'content-type': 'application/json'
    }
  }
  wx.request(requestParam)
}
module.exports = {
  HTTP_HOST: HTTP_HOST,
  API_HOST: API_HOST,
  DEBUG: DEBUG,
  IMG_HOST: IMG_HOST,
  phpRequest: phpRequest
}