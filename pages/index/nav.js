// pages/index/nav.js
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
    wx.navigateTo({
      url: '/pages/index/notification',
    })
  },

  navToIndex: function () {
    wx.navigateTo({
      url: '/pages/index/index',
    })
  }
})