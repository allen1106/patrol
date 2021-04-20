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
    isShare: 0,
    submitList: null,
    page: 1,
    regionList: [{"name": "请选择区域", "department_id": 0}],
    regionIdx: 0,
    regionId: 0,
    subRegionList: [{"name": "请选择公司", "sub_department_id": 0}],
    subRegionIdx: 0,
    subRegionId: 0,
    projectList: [{"name": "请选择项目", "project_id": 0}],
    proIdx: 0,
    projectId: 0,
    subProjectList: [{"name": "请选择子项目", "sub_project_id": 0}],
    subProIdx: 0,
    subProjectId: 0,
    systemList: [{"name": "请选择专业", "industry_id": 0}],
    sysIdx: 0,
    systemId: 0,
    quesList: [{"name": "请选择问题类型", "ques_id": 0}],
    quesIdx: 0,
    quesId: 0,
    statusList: [{"name": "请选择状态", "isFb": 3}, {"name": "已解决", "isFb": 2}, {"name": "待解决", "isFb": 1}],
    statusIdx: 0,
    startDate: "请选择开始时间",
    endDate: "请选择结束时间",
    showCheckbox: false,
    touchStart: 0,
    touchEnd: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    var isFb = Number(options.isfb)
    var isEvaluate = Number(options.isEvaluate)
    var isShare = Number(options.isShare)
    console.log(isFb, isEvaluate)
    that.setData({
      isFb: isFb,
      isEvaluate: isEvaluate,
      isShare: isShare,
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
    that.fetchQuesList()
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
        var list = res.data
        list = that.data.regionList.concat(list)
        that.setData({
          regionList: list
        })
      }
    })
  },

  fetchSubRegionList: function () {
    var that = this
    // 获取部门信息
    api.phpRequest({
      url: 'department_sub.php',
      data: {
        'department_id': that.data.regionId
      },
      success: function (res) {
        var list = res.data
        list = that.data.subRegionList.concat(list)
        that.setData({
          subRegionList: list
        })
      }
    })
  },

  fetchProjectList: function () {
    var that = this
    // 获取项目列表
    api.phpRequest({
      url: 'project.php',
      data: {
        'department_sub_id': that.data.subRegionId
      },
      success: function (res) {
        var list = res.data
        list = that.data.projectList.concat(list)
        that.setData({
          projectList: list
        })
      }
    })
  },

  fetchSubProjectList: function () {
    var that = this
    // 获取子项目列表
    api.phpRequest({
      url: 'project_sub.php',
      data: {
        'project_id': that.data.projectId
      },
      success: function (res) {
        var list = res.data
        list = that.data.subProjectList.concat(list)
        that.setData({
          subProjectList: list
        })
      }
    })
  },

  fetchSystemList: function (fn) {
    return new Promise(resolve => {
      var that = this;
      api.phpRequest({
        url: 'system.php',
        data: {
          userid: wx.getStorageSync('userId')
        },
        success: function (res) {
          var list = res.data
          list = that.data.systemList.concat(list)
          that.setData({
            systemList: list
          })
          if (fn) {
            fn()
          }
        }
      })
    })
  },

  fetchQuesList: function () {
    var that = this
    // 获取问题类型列表
    api.phpRequest({
      url: 'problem.php',
      success: function (res) {
        var list = res.data
        list = that.data.quesList.concat(list)
        that.setData({
          quesList: list
        })
      }
    })
  },

  bindRegionChange: function (e) {
    var idx = e.detail.value
    var that = this
    that.setData({
      regionIdx: idx,
      regionId: that.data.regionList[idx].department_id
    }, () => {
      if (that.data.regionIdx != 0) {
        that.initSubRegionList(that.fetchSubRegionList)
      } else {
        that.initSubRegionList()
      }
      that.fetchTaskList()
    })
  },

  bindSubRegionChange: function (e) {
    var idx = e.detail.value
    var that = this
    that.setData({
      subRegionIdx: idx,
      subRegionId: that.data.subRegionList[idx].department_sub_id
    }, () => {
      if (that.data.subRegionIdx != 0) {
        that.initProjectList(that.fetchProjectList)
      } else {
        that.initProjectList()
      }
      that.fetchTaskList()
    })
  },

  bindProjectChange: function (e) {
    var idx = e.detail.value
    var that = this
    that.setData({
      proIdx: idx,
      projectId: this.data.projectList[idx].project_id
    }, () => {
      if (that.data.proIdx != 0) {
        that.initSubProjectList(that.fetchSubProjectList)
      } else {
        that.initSubProjectList()
      }
      that.fetchTaskList()
    })
  },

  bindSubProjectChange: function (e) {
    var idx = e.detail.value
    this.setData({
      subProIdx: idx,
      subProjectId: this.data.subProjectList[idx].project_sub_id
    }, this.fetchTaskList)
  },

  bindQuesChange: function (e) {
    var idx = e.detail.value
    this.setData({
      quesIdx: idx,
      quesId: this.data.quesList[idx].problem_id
    }, this.fetchTaskList)
  },

  initSubRegionList: function (fn) {
    this.setData({
      subRegionList: [{"name": "请选择公司", "department_id": 0}],
      subRegionIdx: 0,
      subRegionId: 0
    }, () => {
      if (fn) { fn() }
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

  initSubProjectList: function (fn) {
    this.setData({
      subProjectList: [{"name": "请选择子项目", "project_id": 0}],
      subProIdx: 0,
      subProjectId: 0
    }, () => {
      if (fn) { fn() }
    })
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

  fetchTaskList: function (concatFlag) {
    var that = this
    var data = {
      userid: that.data.userId,
      page: that.data.page,
      is_fb: that.data.isFb,
    }
    if (that.data.isShare) {
      data = {
        shareid: that.data.userId
      }
    }
    console.log(that.data)
    if (that.data.regionIdx != 0) {data["department_id"] = that.data.regionId}
    if (that.data.subRegionIdx != 0) {data["department_sub_id"] = that.data.subRegionId}
    if (that.data.projectId != 0) {data["project_id"] = that.data.projectId}
    if (that.data.subProjectId != 0) {data["project_sub_id"] = that.data.subProjectId}
    if (that.data.systemId != 0) {data["industry_id"] = that.data.systemId}
    if (that.data.quesId != 0) {data["problem_id"] = that.data.quesId}
    if (that.data.startDate != "请选择开始时间") {data["startDate"] = that.data.startDate}
    if (that.data.endDate != "请选择结束时间") {data["endDate"] = that.data.endDate}
    if (!concatFlag) {
      data["page"] = 1
    }
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
    if (this.data.showCheckbox) return
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
  },

  showCheckbox: function () {
    this.setData({
      showCheckbox: true
    })
  },
  hideCheckbox: function () {
    this.setData({
      showCheckbox: false
    })
  },
  checkboxChange: function (e) {
    var rids = e.detail.value
    this.setData({
      reportIds: rids
    })
  },
  bindBatchDownload: function () {
    var that = this
    var reportIds = that.data.reportIds.join(',')
    api.phpRequest({
      url: 'batch_download.php',
      data: {'report_id_s': reportIds},
      success: function (res) {
        that.hideCheckbox()
        that.setData({
          fileUrl: res.data.file
        }, that.openFile)
      }
    })
  },
  openFile: function (e) {
    var that = this
    let fileName = new Date().valueOf()
    wx.downloadFile({
      url: that.data.fileUrl,
      header: {
        'content-type': 'application/word'
      },
      filePath: wx.env.USER_DATA_PATH + '/' + fileName + '.doc',
      success (res) {
          wx.openDocument({
            filePath: wx.env.USER_DATA_PATH + '/' + fileName + '.doc',
            showMenu: true
          })
      }
  })
  },
})