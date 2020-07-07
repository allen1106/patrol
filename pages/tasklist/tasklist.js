// pages/tasklist/tasklist.js
var api = require("../../utils/api.js")
var util = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: "",
    userId: null,
    isEvaluate: 0,
    isFb: 1,
    submitList: null,
    page: 1,
    regionList: ["请选择区域"],
    regionIdx: 0,
    projectList: [{"name": "请选择项目", "project_id": 0}],
    proIdx: 0,
    systemList: [{"name": "请选择系统", "industry_id": 0}],
    sysIdx: 0,
    projectId: 0,
    statusList: [{"name": "全部", "isFb": 3}, {"name": "已解决", "isFb": 2}, {"name": "待解决", "isFb": 1}],
    statusIdx: 0,
    systemId: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    var isFb = Number(options.isfb)
    var isEvaluate = Number(options.isEvaluate)
    console.log(isFb, isEvaluate)
    that.setData({
      isFb: isFb,
      isEvaluate: isEvaluate,
      userId: wx.getStorageSync('userId')
    })
    var title = ""
    if (isFb) {
      title += "已"
    } else {
      title += "待"
    }
    if (isEvaluate) {
      title += "处理列表"
    } else {
      title += "巡检任务列表"
    }
    that.setData({
      title: title
    })
    wx.setNavigationBarTitle({
      title: that.data.title
    })
    that.fetchRegionList()
    that.fetchSystemList()
  },

  onShow: function () {
    var that = this;
    that.fetchTaskList()
  },

  fetchRegionList: function () {
    var that = this
    // 获取部门信息
    api.phpRequest({
      url: 'department.php',
      success: function (res) {
        console.log(res)
        var departList = util.formatDepartment(res.data)
        departList = departList.slice(1)
        departList = that.data.regionList.concat(departList)
        that.setData({
          regionList: departList
        })
      }
    })
  },

  fetchProjectList: function () {
    var that = this;
    return new Promise(resolve => {
      api.phpRequest({
        url: 'project.php',
        data: {
          userid: that.data.userId,
          qymc: that.data.regionList[that.data.regionIdx]
        },
        success: function (res) {
          var list = res.data
          that.setData({
            projectList: that.data.projectList.concat(list)
          })
        }
      })
    })
  },

  fetchSystemList: function () {
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
            systemList: that.data.systemList.concat(list)
          })
        }
      })
    })
  },

  initProjectList: function (fn) {
    this.setData({
      projectList: [{"name": "请选择项目", "project_id": 0}],
      proIdx: 0,
      projectId: 0
    }, () => {
      if (fn) { fn() }
    })
  },

  bindRegionChange: function (e) {
    var idx = e.detail.value
    var that = this
    that.setData({
      regionIdx: idx
    }, () => {
      console.log(that.data.regionIdx)
      if (that.data.regionIdx != 0) {
        that.initProjectList(that.fetchProjectList)
      } else {
        that.initProjectList()
      }
      that.fetchTaskList()
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

  bindStatusChange: function (e) {
    var idx = e.detail.value
    this.setData({
      statusIdx: e.detail.value,
      isFb: this.data.statusList[idx].isFb
    }, this.fetchTaskList)
  },

  fetchTaskList: function (concatFlag) {
    var that = this
    var data = {
      userid: that.data.userId,
      page: that.data.page,
      is_fb: that.data.isFb
    }
    console.log(that.data)
    if (that.data.regionIdx != 0) {data["qymc"] = that.data.regionList[that.data.regionIdx]}
    if (that.data.projectId != 0) {data["project_id"] = that.data.projectId}
    if (that.data.systemId != 0) {data["industry_id"] = that.data.systemId}
    if (that.data.projectId != 0) {data["project_id"] = that.data.projectId}
    if (that.data.systemId != 0) {data["industry_id"] = that.data.systemId}
    api.phpRequest({
      url: that.data.isEvaluate ? 'evaluate.php' : 'report.php',
      data: data,
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
    var rid = e.currentTarget.dataset.rid
    var isFb = e.currentTarget.dataset.isfb
    if (this.data.isEvaluate) {
      isFb = this.data.isFb
    }
    console.log(rid, isFb)
    if (this.data.isEvaluate) {
      wx.navigateTo({
        url: '/pages/evaluate/evaluate?id=' + rid + '&isFb=' + isFb,
      })
    } else {
      wx.navigateTo({
        url: '/pages/report/report?id=' + rid + '&isFb=' + isFb,
      })
    }
  }
})