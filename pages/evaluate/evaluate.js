// pages/evaluate/evaluate.js
var api = require("../../utils/api.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: 0,
    isFb: 0,
    reportInfo: null,
    imageList: [],
    image1List: [],
    comments: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    var id = Number(options.id)
    var isFb = Number(options.isFb)
    console.log(id, isFb)
    that.setData({
      isFb: isFb
    })
    api.phpRequest({
      url: 'report_list.php',
      data: {
        id: id
      },
      success: function (res) {
        console.log(res.data)
        that.setData({
          id: id,
          reportInfo: res.data,
          imageList: res.data.imgs.split('|'),
          image1List: res.data.imgs1.split('|')
        })
      }
    })
    if (id != 0) {
      api.phpRequest({
        url: 'evaluate_list.php',
        data: {
          report_id: id
        },
        success: function (res) {
          console.log(res.data)
          that.setData({
            comments: res.data,
          })
        }
      })
    }
  },

  bindSubmitForm: function (e) {
    var that = this
    var comment = e.detail.value.comment
    if (!comment) {
      wx.showToast({
        title: '评论不能为空',
        icon: 'none',
      })
      return
    }
    api.phpRequest({
      url: 'evaluate_save.php',
      data: {
        userid: wx.getStorageSync('userId'),
        report_id: that.data.id,
        content: comment
      },
      success: function (res) {
        if (res.data.status == 1) {
          wx.showToast({
            title: '提交成功',
            icon: 'success',
            success: function () {
              setTimeout(that.bindBack, 1500);
            }
          })
        } else {
          wx.showToast({
            title: '提交失败',
            icon: 'none'
          })
        }
      }
    })
  },
  
  bindBack: function () {
    wx.navigateBack({
      delta: 1
    })
  }
})