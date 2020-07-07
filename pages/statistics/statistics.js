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
    regionList: ["请选择区域"],
    regionIdx: 0,
    projectList: [{"name": "请选择项目", "project_id": 0}],
    proIdx: 0,
    projectId: 0,
    systemList: [{"name": "请选择系统", "industry_id": 0}],
    sysIdx: 0,
    systemId: 0,
    reportSummary: null
  },

  bindChange: function(e) {
    var that = this;
    that.setData({
      currentTab: e.detail.current
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    // var that = this;
    // this.setData({
    //   currentTab: Number(options.tab)
    // })
 
    // /**
    //  * 获取系统信息
    //  */
    // wx.getSystemInfo({
    //   success: function(res) {
    //     that.setData({
    //       winWidth: res.windowWidth,
    //       winHeight: res.windowHeight
    //     });
    //   }
 
    // });

    // /**
    //  * 获取日期列表
    //  */
    // this.setData({
    //   yearList: this.getYearList(),
    // })
    this.fetchRegionList()
    this.fetchSystemList()
    this.fetchList()
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

  // bindDayChange: function (e) {
  //   this.setData({
  //     didx: e.detail.value,
  //   }, this.fetchList)
  // },
  // bindMonthChange: function (e) {
  //   var year = this.data.yearList[this.data.yidx],
  //       month = this.data.monthList[e.detail.value]
  //   this.setData({
  //     midx: e.detail.value,
  //     didx: 0,
  //     dayList: this.getDayList(year, month)
  //   }, this.fetchList)
  // },
  // bindYearChange: function (e) {
  //   this.setData({
  //     yidx: e.detail.value,
  //     midx: 0,
  //     monthList: this.getMonthList()
  //   }, this.fetchList)
  // },

  // getYearList: function () {
  //   var curYear = new Date().getFullYear();
  //   var list = ["全部"]
  //   for (var i=curYear-30; i<=curYear+30; i++) {
  //     list.push(i)
  //   }
  //   return list
  // },

  // getMonthList: function () {
  //   var list = ["全部"]
  //   for (var i=1; i<=12; i++) {
  //     list.push(i)
  //   }
  //   return list
  // },

  // getDayList: function (year, month) {
  //   var list = ["全部"]
  //   for (var i=1; i<=new Date(year, month, 0).getDate(); i++) {
  //     list.push(i)
  //   }
  //   return list
  // },

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
    console.log(idx)
    var that = this
    that.setData({
      regionIdx: idx
    }, () => {
      if (that.data.regionIdx) {
        that.initProjectList(that.fetchProjectList)
      } else {
        that.initProjectList()
      }
      that.fetchList()
    })
  },

  bindProjectChange: function (e) {
    var idx = e.detail.value
    this.setData({
      proIdx: idx,
      projectId: this.data.projectList[idx].project_id
    }, this.fetchList)
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
    if (that.data.regionIdx != 0) {data["qymc"] = that.data.regionList[that.data.regionIdx]}
    if (that.data.projectId != 0) {data["project_id"] = that.data.projectId}
    if (that.data.systemId != 0) {data["industry_id"] = that.data.systemId}
    if (that.data.startDate != "请选择开始时间") {data["startDate"] = that.data.startDate}
    if (that.data.endDate != "请选择结束时间") {data["startDate"] = that.data.endDate}
    api.phpRequest({
      url: 'statistics.php',
      data: data,
      success: function (res) {
        var list = res.data
        that.setData({
          itemList: list
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
        that.setData({
          reportSummary: summary
        })
      }
    })
  }
})