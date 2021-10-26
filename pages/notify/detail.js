// pages/notify/detail.js
const app = getApp()
var api = require("../../utils/api.js")
var util = require("../../utils/util.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    info: null,
    tab: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let nid = options.nid
    this.getInfo(nid)
  },

  getInfo: function (nid) {
    let that = this
    api.phpRequest({
      url: 'news_list.php',
      data: {
        userid: wx.getStorageSync('userId'),
        id: nid
      },
      success: function (res) {
        res.data.imageList = res.data.imgs ? res.data.imgs.split(',') : []
        res.data.read = res.data.read ? res.data.read.split(',') : []
        res.data.no_read = res.data.no_read ? res.data.no_read.split(',') : []

        that.setData({
          info: res.data
        })
      }
    })
  },

  switchTab: function (e) {
    let that = this
    let tabid = Number(e.currentTarget.dataset.tab)
    that.setData({
      tab: tabid,
    })
  },

  previewImage: function (e) {
    var current = e.target.dataset.src
    var imgList = this.data.info.imageList
    wx.previewImage({
      current: current,
      urls: imgList
    })
  },
})