// pages/group/add.js
var util = require("../../utils/util.js")
var api = require("../../utils/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    rawRegionList: [],
    regionStack: null,
    stackPeek: null,
    stackLen: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    that.fetchRegionList()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  convertList: function (l) {
    l.forEach((item) => {
      item.text = item.name
      item.value = item.id
      item.subList = item.sub_depart_list
      item.name = undefined
      item.id = undefined
      item.sub_depart_list = undefined
      if (item.subList) {
        this.convertList(item.subList)
      }
    })
  },

  fetchRegionList: function () {
    let that = this

    // 获取部门信息
    api.phpRequest({
      url: 'department.php',
      success: function (res) {
        that.convertList(res.data)
        that.setData({
          rawRegionList: res.data
        }, () => {
          const stack = new util.Stack()
          stack.push(that.data.rawRegionList)
          that.setData({
            regionStack: stack,
            stackPeek: stack.peek(),
            stackLen: stack.length()
          })
        })
      }
    })
  },

  bindClickRegion: function (e) {
    let that = this
    let region = e.currentTarget.dataset.region
    if (region.subList) {
      that.data.regionStack.push(region.subList)
      that.setData({
        regionStack: that.data.regionStack,
        stackPeek: that.data.regionStack.peek(),
        stackLen: that.data.regionStack.length()
      })
    } else {
      console.log("fetch members!")
    }
  },

  bindReturnRegion: function () {
    let that = this
    that.data.regionStack.pop()
    that.setData({
      regionStack: that.data.regionStack,
      stackPeek: that.data.regionStack.peek(),
      stackLen: that.data.regionStack.length()
    })
  },

  bindBackToIndex: function () {
    wx.navigateBack({
      delta: 1
    })
  },

  bindBatchSubmit: function () {
    
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