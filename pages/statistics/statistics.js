// pages/statistics/statistics.js
var api = require("../../utils/api.js")
var util = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // winWidth: 0,
    // winHeight: 0,
    userId: wx.getStorageSync('userId'),
    startDate: "请选择开始时间",
    endDate: "请选择结束时间",
    itemList: null,
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
    reportSummary: null,
    sortBy: 0, // [总数，未解决，已解决，解决率]
    sortAsc: 0,
    fileUrl: ""
  },

  bindChange: function(e) {
    var that = this
    that.setData({
      currentTab: e.detail.current
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.fetchRegionList()
    this.fetchSystemList()
    this.fetchQuesList()
    this.fetchList()
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
      that.fetchList()
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
      that.fetchList()
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
      that.fetchList()
    })
  },

  bindSubProjectChange: function (e) {
    var idx = e.detail.value
    this.setData({
      subProIdx: idx,
      subProjectId: this.data.subProjectList[idx].project_sub_id
    }, this.fetchList)
  },

  bindQuesChange: function (e) {
    var idx = e.detail.value
    this.setData({
      quesIdx: idx,
      quesId: this.data.quesList[idx].problem_id
    }, this.fetchList)
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
    }, this.fetchList)
  },
  bindStartChange: function (e) {
    var date = e.detail.value
    this.setData({
      startDate: date
    }, this.fetchList)
  },

  bindEndChange: function (e) {
    var date = e.detail.value
    this.setData({
      endDate: date
    }, this.fetchList)
  },

  fetchList: function () {
    var that = this
    var data = {
      userid: wx.getStorageSync('userId')
    }
    if (that.data.regionIdx != 0) {data["department_id"] = that.data.regionId}
    if (that.data.subRegionIdx != 0) {data["department_sub_id"] = that.data.subRegionId}
    if (that.data.projectId != 0) {data["project_id"] = that.data.projectId}
    if (that.data.subProjectId != 0) {data["project_sub_id"] = that.data.subProjectId}
    if (that.data.systemId != 0) {data["industry_id"] = that.data.systemId}
    if (that.data.quesId != 0) {data["problem_id"] = that.data.quesId}
    if (that.data.startDate != "请选择开始时间") {data["startDate"] = that.data.startDate}
    if (that.data.endDate != "请选择结束时间") {data["endDate"] = that.data.endDate}
    api.phpRequest({
      url: 'statistics.php',
      data: data,
      success: function (res) {
        var list = res.data
        for (var i in list) {list[i].ratio = parseInt(list[i].ratio * 100)}
        that.setData({
          itemList: that.sortList(list)
        })
        that.fetchSummary(data)
      }
    })
  },

  fetchSummary: function (data) {
    var that = this
    api.phpRequest({
      url: 'statistics_total.php',
      data: data,
      success: function (res) {
        var summary = res.data
        summary.ratio = parseInt(summary.ratio * 100)
        that.setData({
          reportSummary: summary
        })
      }
    })
  },

  bindSortBy: function (e) {
    var that = this
    var sid = Number(e.target.dataset.sid)
    var sortAsc = null
    if (that.data.sortBy == sid) sortAsc = Number(!that.data.sortAsc)
    else sortAsc = 0
    that.setData({
      sortBy: sid,
      sortAsc: sortAsc
    }, () => {
      that.setData({
        itemList: that.sortList(that.data.itemList)
      })
    })
  },

  sortList: function (itemList) {
    var that = this
    var sortKey = ''
    var sortAsc = that.data.sortAsc
    if (that.data.sortBy == 0) {
      sortKey = 'number'
    } else if (that.data.sortBy == 1) {
      sortKey = 'number1'
    } else if (that.data.sortBy == 2) {
      sortKey = 'number2'
    } else if (that.data.sortBy == 3) {
      sortKey = 'ratio'
    }
    console.log(sortKey)
    itemList.sort((x, y) => {
      console.log(x[sortKey], y[sortKey], x[sortKey] - y[sortKey])
      return sortAsc ? x[sortKey] - y[sortKey] : y[sortKey] - x[sortKey]
    })
    console.log(itemList)
    return itemList
  },

  download: function () {
    var that = this
    var data = {
      userid: wx.getStorageSync('userId'),
      sort_by: that.data.sortBy,
      sort_asc: that.data.sortAsc
    }
    if (that.data.regionIdx != 0) {data["department_id"] = that.data.regionId}
    if (that.data.subRegionIdx != 0) {data["department_sub_id"] = that.data.subRegionId}
    if (that.data.projectId != 0) {data["project_id"] = that.data.projectId}
    if (that.data.subProjectId != 0) {data["project_sub_id"] = that.data.subProjectId}
    if (that.data.systemId != 0) {data["industry_id"] = that.data.systemId}
    if (that.data.quesId != 0) {data["problem_id"] = that.data.quesId}
    if (that.data.startDate != "请选择开始时间") {data["startDate"] = that.data.startDate}
    if (that.data.endDate != "请选择结束时间") {data["endDate"] = that.data.endDate}
    api.phpRequest({
      url: 'statistics_excel.php',
      data: data,
      success: function (res) {
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
      filePath: wx.env.USER_DATA_PATH + '/' + fileName + '.xls',
      success (res) {
          wx.openDocument({
            filePath: wx.env.USER_DATA_PATH + '/' + fileName + '.xls',
            showMenu: true
          })
      }
  })
  },
})