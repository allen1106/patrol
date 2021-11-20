// pages/group/add.js
var util = require("../../utils/util.js")
var api = require("../../utils/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '',
    rawRegionList: [],
    regionStack: null,
    stackPeek: null,
    stackLen: 0,
    departMemberMap: {},
    info: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let title = options.title
    let that = this
    that.setData({
      title: title
    })
    if (options.gid) {
      api.phpRequest({
        url: 'group_list.php',
        data: {
          userid: wx.getStorageSync('userId'),
          group_id: options.gid
        },
        success: function (res) {
          that.setData({
            info: res.data,
          }, that.fetchRegionList)
        }
      })
    } else {
      that.fetchRegionList()
    }
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
      } else {
        this.fetchMember(item.value)
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

  fetchMember: function (departId) {
    let that = this
    api.phpRequest({
      url: 'user.php',
      data: {
        departmentid_id: departId
      },
      success: function (res) {
        if (that.data.info) {
          let ids = []
          for (let i in that.data.info) {
            ids.push(that.data.info[i].id)
          }
          for (let i in res.data) {
            let memberObj = res.data[i]
            if (ids.indexOf(memberObj.id) != -1) {
              memberObj.checked = true
            }
          }
        }
        that.data.departMemberMap[departId] = res.data
        that.setData({
          departMemberMap: that.data.departMemberMap,
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
      let {departMemberMap} = that.data
      for (let i in departMemberMap) {
        for (let j in departMemberMap[i]) {
          let memberObj = departMemberMap[i][j]
          if (i == region.value) {
            memberObj.inbox = true
          } else {
            memberObj.inbox = false
          }
        }
      }
      that.setData({
        showMember: true,
        memberDepartId: region.value,
        departMemberMap: departMemberMap
      })
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

  bindBackToReport: function () {
    var pages = getCurrentPages();
    var reportPage = pages[pages.length - 3]
    reportPage.setData({
      needRefresh: 1
    })
    wx.navigateBack({
      delta: 2,

    })
  },

  bindBatchSubmit: function () {
    let that = this
    let checkedMem= that.getCheckedMember()
    if (!checkedMem) return
    let {pjr_id} = checkedMem

    api.phpRequest({
      url: 'group_submit.php',
      data: {
        userid: wx.getStorageSync('userId'),
        title: that.data.title,
        pjr_id: pjr_id
      },
      method: 'post',
      header: {'content-type': 'application/x-www-form-urlencoded'},
      success: function (res) {
        if (res.data.status == 1) {
          wx.showToast({
            title: '提交成功',
            icon: 'success',
            success: function () {
              if (that.data.reback) {
                setTimeout(that.bindBackToReport, 1500)
              } else {
                setTimeout(that.bindBackToIndex, 1500)
              }
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

  
  bindHideMask: function (e) {
    this.setData({
      showMember: false
    })
  },

  bindInputReg: function (e) {
    this.setData({
      reg: e.detail.value
    })
  },

  searchName1: function () {
    let that = this
    let {reg, departMemberMap} = that.data
    if (!reg) {
      wx.showToast({
        title: '请输入关键字',
        icon: "none"
      })
      return
    }
    for (let i in departMemberMap) {
      for (let j in departMemberMap[i]) {
        let memberObj = departMemberMap[i][j]
        memberObj.inbox = false
        if (memberObj.realname.indexOf(reg) != -1) {
          memberObj.inbox = true
        }
      }
    }
    that.setData({
      showMember: true,
      departMemberMap: departMemberMap
    }, that.bindSearchHandler)
  },

  bindSearchHandler: function () {
    let that = this
    let {reg, departMemberMap} = that.data
    for (let i in departMemberMap) {
      for (let j in departMemberMap[i]) {
        let memberObj = departMemberMap[i][j]
        memberObj.hide = 0
        if (memberObj.realname.indexOf(reg) == -1) {
          memberObj.hide = 1
        }
      }
    }
    that.setData({departMemberMap: that.data.departMemberMap})
  },

  bindPickMember: function (e) {
    var that = this
    var values = e.detail.value
    
    for (let i in that.data.departMemberMap) {
      for (let j in that.data.departMemberMap[i]) {
        let memberObj = that.data.departMemberMap[i][j]
        if (values.indexOf(memberObj.id) != -1) {
          memberObj.checked = true
        }
      }
    }
    that.setData({
      departMemberMap: that.data.departMemberMap,
    })
  },
  delMember: function (e) {
    let that = this
    let {did, midx} = e.currentTarget.dataset
    let {departMemberMap} = that.data
    let memberObj = departMemberMap[did][midx]

    memberObj.checked = false
    that.setData({departMemberMap: departMemberMap})
  },
  
  getCheckedMember: function () {
    let that = this
    let ret = {'pjr_id': []}
    
    for (let i in that.data.departMemberMap) {
      for (let j in that.data.departMemberMap[i]) {
        let memberObj = that.data.departMemberMap[i][j]
        if (memberObj.checked) {
          ret.pjr_id.push(memberObj.id)
        }
      }
    }
    return ret
  },
})