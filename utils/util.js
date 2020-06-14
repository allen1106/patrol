const WEEK_DAY = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return [year, month, day].map(formatNumber).join('-')
}

const formatCNDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return year + "年" + month + "月" + day + "日"
}

const formatWorkDay = date => {
  const workDay = WEEK_DAY[date.getDay()];
  return workDay;
}

const formatObj = data => {
  var list = []
  for (var key in data) {
    if (data[key].length > 0) {
      list = list.concat(data[key])
    } else {
      list.push(key)
    }
  }
  return list
}

const formatDepartment = data => {
  var departmentList = []
  for (var key in data) {
    var obj = data[key]
    departmentList = departmentList.concat(formatObj(obj))
  }
  return departmentList
}

module.exports = {
  formatTime: formatTime,
  formatCNDate: formatCNDate,
  formatWorkDay: formatWorkDay,
  formatDepartment: formatDepartment,
  formatDate: formatDate
}
