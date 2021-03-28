var util = require("../../utils/util.js")
var api = require("../../utils/api.js")

//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    date: null,
    workDay: null,
    showLogin: true,
    taskNum: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var curTime = new Date();
    var curDate = util.formatCNDate(curTime);
    this.setData({
      date: curDate,
      workDay: util.formatWorkDay(curTime)
    })
    // 提示用户先进行登录
    var userBind = wx.getStorageSync('userBind')
    if (userBind) {
      this.setData({
        showLogin: false
      })
    }
  },

  onShow: function () {
    var that = this
    var userId = wx.getStorageSync('userId')
    var userBind = wx.getStorageSync('userBind')
    if (userBind) {
      // 发送请求获取用户信息
      api.phpRequest({
        url: 'info.php',
        data: {
          userid: userId
        },
        success: function (res) {
          getApp().globalData.userInfo = res.data
        }
      })
      api.phpRequest({
        url: 'mail.php',
        data: {
          userid: userId
        },
        success: function (res) {
          that.setData({
            taskNum: res.data.number,
            showLogin: false
          })
        }
      })
    } else {
      // wx.navigateTo({
      //   url: '/pages/login/login'
      // })
    }
  },

  navigateToTaskList: function (e) {
    if (this.data.showLogin) {
      wx.showToast({
        title: '尚未登录',
        icon: 'error',
      })
    } else {
      wx.navigateTo({
        url: '/pages/tasklist/tasklist?isEvaluate=0&isfb=' + e.currentTarget.dataset.isfb,
      })
    }
  },

  navigateToEvaluate: function (e) {
    if (this.data.showLogin) {
      wx.showToast({
        title: '尚未登录',
        icon: 'error',
      })
    } else {
      wx.navigateTo({
        url: '/pages/tasklist/tasklist?isEvaluate=1&isfb=' + e.currentTarget.dataset.isfb,
      })
    }
  },

  navigateToStatistics: function (e) {
    if (this.data.showLogin) {
      wx.showToast({
        title: '尚未登录',
        icon: 'error',
      })
    } else {
      wx.navigateTo({
        url: '/pages/statistics/statistics?tab=' + e.currentTarget.dataset.tab,
      })
    }
  },

  navigateToReport: function (e) {
    if (this.data.showLogin) {
      wx.showToast({
        title: '尚未登录',
        icon: 'error',
      })
    } else {
      let rid = Number(e.currentTarget.dataset.id)
      if (rid == 0) {
        // 获取位置信息，如果没有弹出提示框
        wx.getSetting({
          success: function (res) {
            wx.getLocation({
              type: 'gcj02',
              altitude: true,//高精度定位
              //定位成功，更新定位结果
              success (res) {
                wx.navigateTo({
                  url: '/pages/report/report?id=' + rid + '&lng=' + res.longitude + '&lat=' + res.latitude,
                })
              },
              //定位失败回调
              fail: function () {
                wx.showModal({
                  title: '警告',
                  content: '您没有授权获取位置信息，将无法提交报告。请10分钟后再次点击授权，或者删除小程序重新进入。',
                  showCancel: false,
                  confirmText: '我知道了'
                })
              },
              complete: function () {
                //隐藏定位中信息进度
                wx.hideLoading()
              }
            })
          }
        })
      } else {
        wx.navigateTo({
          url: '/pages/report/report?id=' + rid,
        })
      }
    }
  },

  navigateToPersonal: function () {
      wx.navigateTo({
        url: '/pages/personal/personal',
      })
  },

  logout: function (e) {
    wx.showModal({
      title: '温馨提示',
      content: '您确定要退出登录吗？这可能导致您不能正常使用巡检功能',
      showCancel: true,
      cancelText: '我再想想',
      confirmText: '继续退出',
      success: function (res) {
        wx.removeStorageSync('userId');
        wx.removeStorageSync('userBind');
        app.globalData.userInfo = null;
        wx.reLaunch({
          url: '../index/index'
        })
      }
    })
  }
})
