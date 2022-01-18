// pages/personal/personal.js
var api = require("../../utils/api.js")
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    projectList: null,
    showMask: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onShow: function (options) {
    var userInfo = app.globalData.userInfo
    var that = this
    if (userInfo) {
      console.log(userInfo)
      this.setData({
        userInfo: userInfo
      }, this.fetchProjectList)
    } else {
      var userId = wx.getStorageSync('userId')
      var userBind = wx.getStorageSync('userBind')
      if (userId && userBind) {
        // 发送请求获取用户信息
        api.phpRequest({
          url: 'info.php',
          data: {
            userid: userId
          },
          success: function (res) {
            console.log(res)
            that.setData({
              userInfo: res.data
            }, that.fetchProjectList)
            getApp().globalData.userInfo = res.data
          }
        })
      } else {
        wx.navigateTo({
          url: '/pages/login/login'
        })
      }
    }
  },
  fetchProjectList: function () {
    var that = this;
    return new Promise(resolve => {
      api.phpRequest({
        url: 'project.php',
        data: {
          userid: wx.getStorageSync('userId')
        },
        success: function (res) {
          var list = res.data
          that.setData({
            projectList: list
          })
        }
      })
    })
  },
  navigateToTaskList: function (e) {
    var isEvaluate = e.currentTarget.dataset.isevaluate
    wx.navigateTo({
      url: '/pages/tasklist/tasklist?isfb=1&isEvaluate=' + isEvaluate,
    })
  },
  navigateToGroup: function () {
    var userInfo = app.globalData.userInfo
    if (userInfo.audit != 1) {
      wx.showToast({
        title: '审核中，请等待管理员审核',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/group/group'
    })
  },
  bindClose: function () {
    this.setData({
      showMask: 0
    })
  }
})