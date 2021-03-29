// pages/register/register.js
var api = require("../../utils/api.js")
var util = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    departmentList: [],
    didx: 0,
    systemList: [],
    sidx: 0
  },

  onLoad: function (e) {
    var that = this
    // 获取部门信息
    api.phpRequest({
      url: 'departmentlist.php',
      success: function (res) {
        that.setData({
          departmentList: res.data,
          didx: 0
        }, that.fetchSystemList)
      }
    })
  },

  bindPickerChange: function (e) {
    this.setData({
      didx: e.detail.value
    }, this.fetchSystemList)
  },

  fetchSystemList: function () {
    return new Promise(resolve => {
      var that = this
      api.phpRequest({
        url: 'system.php',
        data: {
          department_id: that.data.departmentList[that.data.didx].id
        },
        success: function (res) {
          that.setData({
            systemList: res.data,
            sidx: 0
          })
        }
      })
    })
  },

  bindSystemChange: function (e) {
    this.setData({
      sidx: e.detail.value
    })
  },

  register: function (e) {
    var that = this
    var userId = wx.getStorageSync('userId')
    var value = e.detail.value
    var tipMsg = ""
    if (!value.realname) { tipMsg="姓名不能为空" }
    // if (!value.idnum) { tipMsg="身份证号不能为空" }
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
      // 'idnum': value.idnum,
      'realname': value.realname,
      'department': that.data.departmentList[that.data.didx].name
    }
    if (that.data.systemList.length > 0) {
      data['industry_id'] = that.data.systemList[that.data.sidx].industry_id
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
            wx.setStorageSync('userId', data['userid'])
            wx.setStorageSync('userBind', 1)
            wx.showToast({
              title: '注册成功',
              icon: 'success',
            })
            wx.navigateBack({
              delta: 2
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