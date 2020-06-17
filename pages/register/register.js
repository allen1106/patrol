// pages/register/register.js
var api = require("../../utils/api.js")
var util = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    departmentList: null,
    department: null
  },

  onLoad: function (e) {
    var that = this
    // 获取部门信息
    api.phpRequest({
      url: 'department.php',
      success: function (res) {
        console.log(res)
        var departList = util.formatDepartment(res.data)
        console.log(departList)
        that.setData({
          departmentList: departList,
          department: departList[0]
        })
      }
    })
  },

  bindPickerChange: function (e) {
    this.setData({
      department: this.data.departmentList[e.detail.value]
    })
  },

  register: function (e) {
    var that = this
    var userId = wx.getStorageSync('userId')
    var value = e.detail.value
    var tipMsg = ""
    if (!value.realname) { tipMsg="姓名不能为空" }
    if (!value.idnum) { tipMsg="身份证号不能为空" }
    if (value.password != value.repeatpass) { tipMsg="两次密码不一致" }
    if (!value.password) { tipMsg="密码不能为空" }
    if (!value.tel) { tipMsg="手机号不能为空" }
    if (tipMsg) {
      wx.showToast({
        title: tipMsg,
        icon: 'none',
      })
      return
    }
    var data = {
      'userid': userId,
      'tel': value.tel,
      'password': value.password,
      'idnum': value.idnum,
      'realname': value.realname,
      'department': that.data.department
    }
    console.log("提交数据")
    console.log(data)
    api.phpRequest({
      url: 'regedit.php',
      method: 'Post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: data,
      success: function(res){
        var status = Number(res.data.status)
        console.log(res);
        switch (status) {
          case 1:
            wx.showToast({
              title: '注册成功',
              icon: 'success',
            })
            wx.navigateBack({
              delta: 1
            })
            break
          case 2:
            wx.showToast({
              title: '用户名已存在',
              icon: 'none',
            })
            break
          default:
            wx.showToast({
              title: '注册失败',
              icon: 'none',
            })
        }
      },
      fail: function(){
        wx.showToast({
          title: '注册失败',
          icon: 'none',
        })
        this.onLoad();
      }
    })
  },

  navigateToLogin: function (e) {
    wx.navigateBack({
      delta: 1
    })
  }
})