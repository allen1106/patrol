const HTTP_HOST = 'https://xunjian.hxy66.net'
const API_HOST = HTTP_HOST + '/api/'
const DEBUG = false
const IMG_HOST = DEBUG ? '' : HTTP_HOST
var Mock = require('../utils/mock.js')
function phpRequest(requestParam) {
  if (!DEBUG) {
    var url = requestParam.url
    requestParam.url = API_HOST + url
    if (!requestParam.header) {
      requestParam.header = {
        'content-type': 'application/json'
      }
    }
    wx.request(requestParam)
  } else {
    var fn = requestParam.success
    var url = requestParam.url
    var res = null
    // 模拟数据
    if (url == 'login.php') {
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': {
          "userid": 3,
          "bind": 0
        }
      })
    } else if (url == 'bind.php') {
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': {
          "status": 1
        }
      })
    } else if (url == "regedit.php") {
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': {
          "status": 1
        }
      })
    } else if (url == 'info.php') {
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': {
          "realname": "小小的忧愁",
          "department": "事业部",
          "report": 5,
          "evaluate": 1
        }
      })
    } else if (url == 'mail.php') {
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': {
          "number": 2
        }
      })  
    } else if (url == 'report.php') {
      var list = [
        { "name": "郑州绿地一期", "task_time": "2020年6月1日 20:20:20", id: 1},
        { "name": "郑州绿地二期", "task_time": "2020年6月2日 20:20:20", id: 2},
        { "name": "郑州绿地三期", "task_time": "2020年6月3日 20:20:20", id: 3},
        { "name": "郑州绿地四期", "task_time": "2020年6月4日 20:20:20", id: 4},
        { "name": "郑州绿地五期", "task_time": "2020年6月5日 20:20:20", id: 5},
        { "name": "郑州绿地六期", "task_time": "2020年6月6日 20:20:20", id: 6},
        { "name": "郑州绿地七期", "task_time": "2020年6月7日 20:20:20", id: 7},
        { "name": "郑州绿地八期", "task_time": "2020年6月8日 20:20:20", id: 8},
        { "name": "郑州绿地九期", "task_time": "2020年6月9日 20:20:20", id: 9},
        { "name": "郑州绿地十期", "task_time": "2020年6月10日 20:20:20", id: 10},
        { "name": "郑州绿地十一期", "task_time": "2020年6月11日 20:20:20", id: 11},
        { "name": "郑州绿地十二期", "task_time": "2020年6月12日 20:20:20", id: 12},
      ]
      var pageNum = 8
      var totalPage = Math.ceil(list.length / (pageNum * 1.0))
      var page = requestParam.data.page ? requestParam.data.page : 1
      list = list.slice(pageNum * (page - 1), pageNum * page)
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': list
      })
    } else if (url == "evaluate.php") {
      var list = [
        { "name": "郑州绿地一期", "task_time": "2020年6月1日 20:20:20", id: 1},
        { "name": "郑州绿地二期", "task_time": "2020年6月2日 20:20:20", id: 2},
        { "name": "郑州绿地三期", "task_time": "2020年6月3日 20:20:20", id: 3},
        { "name": "郑州绿地四期", "task_time": "2020年6月4日 20:20:20", id: 4},
        { "name": "郑州绿地五期", "task_time": "2020年6月5日 20:20:20", id: 5},
        { "name": "郑州绿地六期", "task_time": "2020年6月6日 20:20:20", id: 6},
        { "name": "郑州绿地七期", "task_time": "2020年6月7日 20:20:20", id: 7},
        { "name": "郑州绿地八期", "task_time": "2020年6月8日 20:20:20", id: 8},
        { "name": "郑州绿地九期", "task_time": "2020年6月9日 20:20:20", id: 9},
        { "name": "郑州绿地十期", "task_time": "2020年6月10日 20:20:20", id: 10},
        { "name": "郑州绿地十一期", "task_time": "2020年6月11日 20:20:20", id: 11},
        { "name": "郑州绿地十二期", "task_time": "2020年6月12日 20:20:20", id: 12},
      ]
      var pageNum = 8
      var totalPage = Math.ceil(list.length / (pageNum * 1.0))
      var page = requestParam.data.page ? requestParam.data.page : 1
      list = list.slice(pageNum * (page - 1), pageNum * page)
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': list
      })
    }else if (url == "project.php") {
      var list = [
        { "name": "郑州绿地一期", "project_id": 1},
        { "name": "郑州绿地二期", "project_id": 2},
        { "name": "郑州绿地三期", "project_id": 3},
        { "name": "郑州绿地四期", "project_id": 4},
        { "name": "郑州绿地五期", "project_id": 5},
        { "name": "郑州绿地六期", "project_id": 6}
      ]
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': list
      })
    } else if (url == 'system.php') {
      var list = [
        { "name": "智能化系统一期", "industry_id": 1},
        { "name": "智能化系统二期", "industry_id": 2},
        { "name": "智能化系统三期", "industry_id": 3},
        { "name": "智能化系统四期", "industry_id": 4},
        { "name": "智能化系统五期", "industry_id": 5},
        { "name": "智能化系统六期", "industry_id": 6}
      ]
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': list
      })
    } else if (url == 'department.php') {
      var dataList = {
        "事业部": [],
        "区域部": ["二七部", "新郑部"]
      }
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': dataList
      })
    } else if (url == 'user.php'){
      var data = {
        0: [
          {"realname": "张三1", "id": 1},
          {"realname": "李四1", "id": 2},
        ],
        1: [
          {"realname": "张三2", "id": 3},
          {"realname": "李四2", "id": 4}
        ],
        2: [
          {"realname": "张三3", "id": 5},
          {"realname": "李四3", "id": 6},
          {"realname": "王二3", "id": 7},
          {"realname": "麻子3", "id": 8}
        ],
      }
      var ret = data[requestParam.data.departmentid]
      res = Mock.mock({
        'msg': "request:ok",
        'statusCode':200,
        'data': ret
      })
    } else if (url == 'report_submit.php'){
      console.log(requestParam)
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok'
      })
    } else if (url == 'report_list.php') {
      data = {
        "title": "郑州xxx区房屋漏水",
        "bgbh":"2020060115160001",
        "task_time":"2020年06年01日20:20:20",
        "region":"区域",
        "position":"部位",
        "question":"问题描述",
        "reason":"原因",
        "solve":"解决办法",
        "imgs":"https://xunjian.17letao.cn/js/kindeditor/attached/20200601/202006011243.jpg|https://xunjian.17letao.cn/js/kindeditor/attached/20200601/202006011243.jpg|https://xunjian.17letao.cn/js/kindeditor/attached /20200601/202006011243.jpg",
        "imgs1":" https://xunjian.17letao.cn/js/kindeditor/attached/20200601/202006011243.jpg",
        "report_id":"1"
      }
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': data
      })
    } else if (url == 'evaluate_list.php') {
      var list = [
        {"evaluate_name":"小李","evaluate_time":"2020-06-01 15:32:11","evaluate_content":"评价的内容1"},
        {"evaluate_name":"小张","evaluate_time":"2020-06-01 15:32:11","evaluate_content":"评价的内容2"},
        {"evaluate_name":"小王","evaluate_time":"2020-06-01 15:32:11","evaluate_content":"评价的内容3"},
        {"evaluate_name":"小菜","evaluate_time":"2020-06-01 15:32:11","evaluate_content":"评价的内容4"},
      ]
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': list
      })
    } else if (url == 'statistics.php') {
      var list = [
        {"realname":"张某某","department":"技发部","number":"1"},
        {"realname":"李某某","department":"二七部","number":"3"},
        {"realname":"孙某某","department":"新郑部","number":"12"},
        {"realname":"刘某某","department":"龙子湖部","number":"8"},
      ]
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok',
        'data': list
      })
    } else if (url == 'pay.php') {
      res = Mock.mock({
        'statusCode': 200,
        'errMsg': 'request:ok'
      })
    }
    fn(res);
  }
}
module.exports = {
  HTTP_HOST: HTTP_HOST,
  API_HOST: API_HOST,
  DEBUG: DEBUG,
  IMG_HOST: IMG_HOST,
  phpRequest: phpRequest
}