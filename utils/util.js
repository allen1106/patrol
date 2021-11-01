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

/**
* Stack 类
*/
class Stack {
  constructor() {
  this.data = []; // 对数据初始化
  this.top = 0; // 初始化栈顶位置
  }
 
  // 入栈方法
  push() {
  const args = [...arguments];
  args.forEach(arg => this.data[this.top++] = arg);
  return this.top;
  }
 
  // 出栈方法
  pop() {
  if (this.top === 0) throw new Error('The stack is already empty!');
  const peek = this.data[--this.top];
  this.data = this.data.slice(0, -1);
  return peek;
  }
 
  // 返回栈顶元素
  peek() {
  return this.data[this.top - 1];
  }
 
  // 返回栈内元素个数
  length() {
  return this.top;
  }
 
  // 清除栈内所有元素
  clear() {
  this.top = 0;
  return this.data = [];
  }
 
  // 判断栈是否为空
  isEmpty() {
  return this.top === 0;
  }
 }

module.exports = {
  formatTime: formatTime,
  formatCNDate: formatCNDate,
  formatWorkDay: formatWorkDay,
  formatDepartment: formatDepartment,
  formatDate: formatDate,
  Stack: Stack
}
