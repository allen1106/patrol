// pages/index/nav.js
const app = getApp()
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

  navToNotification: function () {
    var userInfo = app.globalData.userInfo
    if (userInfo && userInfo.audit != 1) {
      wx.showToast({
        title: '审核中，请等待管理员审核',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/notify/list',
    })
  },

  navToIndex: function () {
    wx.navigateTo({
      url: '/pages/index/index',
    })
  }
})