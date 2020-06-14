// pages/personal/personal.js
var api = require("../../utils/api.js")
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null
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
      })
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
            })
            getApp().globalData.userInfo = res.data
          }
        })
      } else {
        wx.navigateTo({
          url: '/pages/login/login'
        })
      }
    }
  }
})