// pages/notify/list.js
const app = getApp()
var api = require("../../utils/api.js")
var util = require("../../utils/util.js")

const menuTabStatusMap = [1, 2, 3]

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userId: wx.getStorageSync('userId'),
    tab: 0,
    startDate: "开始时间",
    endDate: "结束时间",
    searchkey: "",
    submitList: null,
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
    this.fetchTaskList()
  },

  bindStartChange: function (e) {
    var date = e.detail.value
    this.setData({
      startDate: date
    }, this.fetchTaskList)
  },

  bindEndChange: function (e) {
    var date = e.detail.value
    this.setData({
      endDate: date
    }, this.fetchTaskList)
  },

  switchTab: function (e) {
    let that = this
    let tabid = Number(e.currentTarget.dataset.tab)
    that.setData({tab: tabid}, that.fetchTaskList)
  },

  bindInputRejectRes: function (e) {
  },

  bindSearch: function (e) {
    this.setData({
      searchkey: e.detail.value
    }, this.fetchTaskList)
  },

  fetchTaskList: function () {
    var that = this
    var data = {
      userid: that.data.userId,
      is_fb: menuTabStatusMap[that.data.tab]
    }
    if (that.data.startDate != "开始时间") {data["startDate"] = that.data.startDate}
    if (that.data.endDate != "结束时间") {data["endDate"] = that.data.endDate}
    if (that.data.searchkey) {data["title"] = that.data.searchkey}
    api.phpRequest({
      url: 'news.php',
      data: data,
      success: function (res) {
        var list = res.data
        that.setData({
          submitList: list
        })
      }
    })
  },

  navigateToAdd: function () {
    wx.navigateTo({
      url: '/pages/notify/add'
    })
  },

  viewReport: function (e) {
    let nid = e.currentTarget.dataset.nid
    wx.navigateTo({
      url: '/pages/notify/detail?nid=' + nid,
    })
  }
})