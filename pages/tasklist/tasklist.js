// pages/tasklist/tasklist.js
var api = require("../../utils/api.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userId: wx.getStorageSync('userId'),
    isEvaluate: 0,
    isFb: 1,
    submitList: null,
    page: 1,
    projectList: null,
    proIdx: 0,
    systemList: null,
    sysIdx: 0,
    projectId: null,
    systemId: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    that.setData({
      isFb: Number(options.isfb),
      isEvaluate: Number(options.isEvaluate)
    })
    that.fetchProjectList(this.fetchSystemList, this.fetchTaskList)
  },

  fetchProjectList: function (fn1, fn2) {
    console.log("fetchProjectList")
    return new Promise(resolve => {
      var that = this;
      api.phpRequest({
        url: 'project.php',
        data: {
          userid: that.data.userId
        },
        success: function (res) {
          var list = res.data
          that.setData({
            projectList: list,
            projectId: list[0].project_id
          })
          if (fn1) {
            fn1(fn2)
          }
        }
      })
    })
  },

  fetchSystemList: function (fn) {
    console.log("fetchSystemList")
    return new Promise(resolve => {
      var that = this;
      api.phpRequest({
        url: 'system.php',
        data: {
          userid: that.data.userId
        },
        success: function (res) {
          var list = res.data
          that.setData({
            systemList: list,
            systemId: list[0].industry_id
          })
          if (fn) {
            fn()
          }
        }
      })
    })
  },

  bindProjectChange: function (e) {
    var idx = e.detail.value
    this.setData({
      proIdx: idx,
      projectId: this.data.projectList[idx].project_id
    }, this.fetchTaskList)
  },

  bindSystemChange: function (e) {
    var idx = e.detail.value
    this.setData({
      sysIdx: e.detail.value,
      systemId: this.data.systemList[idx].industry_id
    }, this.fetchTaskList)
  },

  fetchTaskList: function (concatFlag) {
    var that = this
    api.phpRequest({
      url: that.data.isEvaluate ? 'evaluate.php' : 'report.php',
      data: {
        userid: that.data.userId,
        page: that.data.page,
        project_id: that.data.projectId,
        industry_id: that.data.systemId,
        is_fb: that.data.isFb
      },
      success: function (res) {
        console.log(res)
        var list = res.data
        if (concatFlag) {
          list = that.data.submitList.concat(list)
        }
        that.setData({
          submitList: list
        })
      }
    })
  },
  
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var fetchWrapper = function () {
      this.fetchTaskList(true)
    }
    this.setData({
      page: this.data.page + 1
    }, fetchWrapper)
  },

  viewReport: function (e) {
    console.log(e.currentTarget.dataset.rid)
    if (this.data.isEvaluate) {
      wx.navigateTo({
        url: '/pages/evaluate/evaluate?id=' + e.currentTarget.dataset.rid + '&isFb=' + this.data.isFb,
      })
    } else {
      wx.navigateTo({
        url: '/pages/report/report?id=' + e.currentTarget.dataset.rid + '&isFb=' + this.data.isFb,
      })
    }
  }
})