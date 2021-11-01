// pages/index/notification.js
var api = require("../../utils/api.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this
    let userId = wx.getStorageSync('userId')
    let userBind = wx.getStorageSync('userBind')
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
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})