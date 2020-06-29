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
    startDate: "开始时间",
    endDate: "结束时间",
    itemList: null
  },

  bindChange: function(e) {
    var that = this;
    that.setData({
      currentTab: e.detail.current
    });
  },

  // swichNav: function(e) {
  //   var that = this;
  //   if(this.data.currentTab === e.target.dataset.current) {
  //     return false;
  //   } else {
  //     that.setData({
  //       currentTab: e.target.dataset.current
  //     })
  //   }
  // },

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
    this.fetchList()
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
    if (that.data.startDate != "开始时间") {data["startDate"] = that.data.startDate}
    if (that.data.endDate != "结束时间") {data["startDate"] = that.data.endDate}
    api.phpRequest({
      url: 'statistics.php',
      data: data,
      success: function (res) {
        var list = res.data
        that.setData({
          itemList: list
        })
      }
    })
  },
})