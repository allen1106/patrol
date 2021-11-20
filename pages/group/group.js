// pages/group/group.js
var util = require("../../utils/util.js")
var api = require("../../utils/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '',
    groupList: [],
    selectAll: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let reback = options.reback
    if (reback) {
      this.setData({
        reback: reback
      })
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.fetchGroupList()
  },

  bindInputTitle: function (e) {
    let title = e.detail.value
    this.setData({
      title: title
    })
  },

  navToAdd: function () {
    if (!this.data.title) {
      wx.showToast({
        title: '请输入分组名称',
      })
      return
    }
    if (this.data.reback) {
      wx.navigateTo({
        url: '/pages/group/add?reback=' + this.data.reback + '&title=' + this.data.title,
      })
    } else {
      wx.navigateTo({
        url: '/pages/group/add?title=' + this.data.title,
      })
    }
  },
  fetchGroupList: function () {
    let that = this
    api.phpRequest({
      url: 'group.php',
      data: {
        userid: wx.getStorageSync('userId')
      },
      success: function (res) {
        that.setData({
          groupList: res.data,
        })
      }
    })
  },
  checkboxChange: function (e) {
    let that = this
    var rids = e.detail.value
    let is_all = true
    for (let i in that.data.groupList) {
      let obj = that.data.groupList[i]
      if (rids.indexOf(obj.id) != -1) {
        obj.checked = true
      } else {
        obj.checked = false
        is_all = false
      }
    }
    that.setData({
      groupList: that.data.groupList,
      selectAll: is_all
    })
  },
  bindSelectAll: function () {
    let that = this
    for (let i in that.data.groupList) {
      let obj = that.data.groupList[i]
      if (that.data.selectAll) {
        obj.checked = false
      } else {
        obj.checked = true
      }
    }
    that.setData({
      groupList: that.data.groupList,
      selectAll: !that.data.selectAll
    })
  },
  batchAction: function (fn) {
    let that = this,
        reportIds = []
    for (let i in that.data.groupList) {
      let obj = that.data.groupList[i]
      if (obj.checked) {
        reportIds.push(obj.id)
      }
    }
    let idstr = reportIds.join(',')
    if (idstr) {
      fn(idstr)
    } else {
      wx.showToast({
        title: "请选择报告",
        icon: "none"
      })
    }
  },
  bindBatchDelete: function () {
    let that = this
    that.batchAction((idstr) => {
      api.phpRequest({
        url: 'group_delete.php',
        data: {'group_id_s': idstr},
        success: function (res) {
          if (res.data.status == 1) {
            wx.showToast({
              title: '删除成功',
              icon: "success",
              success: that.fetchGroupList
            })
          } else {
            wx.showToast({
              title: '删除失败',
              icon: "none"
            })
          }
        }
      })
    })
  },
  bindEditGroup: function (e) {
    let gid = e.currentTarget.dataset.rid
    wx.navigateTo({
      url: '/pages/group/add?gid=' + gid,
    })
  }
})