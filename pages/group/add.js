// pages/group/add.js
var util = require("../../utils/util.js")
var api = require("../../utils/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '',
    currentTab: 0,
    rawRegionList: [],
    regionStack: null,
    stackPeek: null,
    stackLen: 0,
    departMemberMap: {},
    info: null,
    gid: null,
    memberBox1: null,
    memberBox2: null,
  },

  flatList: function (l, m) {
    l.forEach((item) => {
      if (item.subList) {
        m[item.value] = {
          text: item.text,
          subList: item.subList
        }
        this.flatList(item.subList, m)
      } else {
        m[item.value] = {
          text: item.text
        }
      }
    })
    this.setData({
      nextListMap: m
    })
  },

  convertList1: function (l) {
    l.forEach((item) => {
      item.text = item.name
      item.value = item.id
      item.subList = item.sub_depart_list
      item.name = undefined
      item.id = undefined
      item.sub_depart_list = undefined
      if (item.subList) {
        this.convertList1(item.subList)
      } else {
        this.fetchMember(item.value, item.flag)
      }
    })
  },

  setMemberBox: function () {
    let {departMemberMap} = this.data
    let memberBoxIds1 = new Set([])
    let memberBox1 = []
    let memberBoxIds2 = new Set([])
    let memberBox2 = []
    for (let i in departMemberMap) {
      for (let j in departMemberMap[i]) {
        let memberObj = departMemberMap[i][j]
        if (memberObj.checked) {
          if (!memberBoxIds1.has(memberObj.id)) memberBox1.push(memberObj)
          memberBoxIds1.add(memberObj.id)
        }
        if (memberObj.checked1) {
          if (!memberBoxIds2.has(memberObj.id)) memberBox2.push(memberObj)
          memberBoxIds2.add(memberObj.id)
        }
      }
    }
    this.setData({
      memberBox1: memberBox1,
      memberBox2: memberBox2
    })
  },

  fetchMember: function (departId, flag) {
    let that = this
    api.phpRequest({
      url: 'user.php',
      data: {
        departmentid_id: departId,
        flag: flag
      },
      success: function (res) {
        if (that.data.gid) {
          for (let i in res.data) {
            if (that.data.info.filter((item) => item.id == res.data[i].id).length > 0) {
              res.data[i].checked = true
            }
          }
        }
        that.data.departMemberMap[departId] = res.data
        that.setData({
          departMemberMap: that.data.departMemberMap,
        }, that.setMemberBox)
      }
    })
  },

  initMemberList: function () {
    let that = this

    // 获取部门信息
    api.phpRequest({
      url: 'department1.php',
      data: {userid: wx.getStorageSync('userId')},
      success: function (res) {
        that.convertList1(res.data)
        that.flatList(res.data, {})
        const stack = new util.Stack()
        stack.push(res.data)
        that.setData({
          regionStack: stack,
          stackPeek: stack.peek(),
          stackLen: stack.length()
        })
      }
    })
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
            gid: options.gid
          })
        }
      })
    }
    that.initMemberList()
    let reback = options.reback
    if (reback) {
      this.setData({
        reback: reback
      })
    }
  },

  bindInputTitle: function (e) {
    let title = e.detail.value
    this.setData({
      title: title
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
      }, that.setMemberBox)
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
    var reportPage = pages[pages.length - 2]
    reportPage.setData({
      needRefresh: 1
    })
    wx.navigateBack({
      delta: 1,
    })
  },

  bindBatchSubmit: function () {
    let that = this
    let checkedMem= that.getCheckedMember()
    if (!checkedMem) return
    let {pjr_id} = checkedMem
    let data = {
      userid: wx.getStorageSync('userId'),
      title: that.data.title,
      pjr_id: pjr_id
    }
    if (that.data.gid) {
      data['group_id'] = that.data.gid
    }

    api.phpRequest({
      url: 'group_submit.php',
      data: data,
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
    // this.setData({
    //   reg: '',
    //   showMember: false
    // }, this.bindSearchHandler)
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
    }, () => {
      that.setMemberBox()
      that.bindSearchHandler()
    })
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
    that.setData({departMemberMap: that.data.departMemberMap}, that.setMemberBox)
  },

  bindPickMember: function (e) {
    var that = this
    var values = e.detail.value
    var currentTab = that.data.currentTab
    
    for (let i in that.data.departMemberMap) {
      for (let j in that.data.departMemberMap[i]) {
        let memberObj = that.data.departMemberMap[i][j]
        if (currentTab == 0) {
          if (values.indexOf(memberObj.id) != -1) {
            memberObj.checked = true
          }
        } else {
          if (values.indexOf(memberObj.id) != -1) {
            memberObj.checked1 = true
          }
        }
      }
    }
    that.setData({
      departMemberMap: that.data.departMemberMap,
    }, that.setMemberBox)
  },

  bindPickMember1: function (e) {
    var that = this
    var mid = Number(e.currentTarget.dataset.mid)
    var currentTab = that.data.currentTab
    
    for (let i in that.data.departMemberMap) {
      for (let j in that.data.departMemberMap[i]) {
        let memberObj = that.data.departMemberMap[i][j]
        if (memberObj.id == mid) {
          if (currentTab == 0) {
              memberObj.checked = !memberObj.checked
          } else {
            memberObj.checked1 = !memberObj.checked1
          }
        }
      }
    }
    that.setData({
      departMemberMap: that.data.departMemberMap,
    }, that.setMemberBox)
  },

  delMember: function (e) {
    let that = this
    let {midx} = e.currentTarget.dataset
    let {departMemberMap, currentTab} = that.data

    for (let i in departMemberMap) {
      for (let j in departMemberMap[i]) {
        if (departMemberMap[i][j].id == midx) {
          if (currentTab == 0) {
            departMemberMap[i][j].checked = false
          } else {
            departMemberMap[i][j].checked1 = false
          }
        }
      }
    }
    that.setData({departMemberMap: departMemberMap}, that.setMemberBox)
  },

  getCheckedMember: function () {
    let that = this
    let ret = {'pjr_id': [], 'csr_id': []}
    
    for (let i in that.data.departMemberMap) {
      for (let j in that.data.departMemberMap[i]) {
        let memberObj = that.data.departMemberMap[i][j]
        if (memberObj.checked) {
          ret.pjr_id.push(memberObj.id)
        }
        if (memberObj.checked1) {
          ret.csr_id.push(memberObj.id)
        }
      }
    }
    return ret
  },
  checkedSub: function (l, flag) {
    let that = this
    l.forEach((item) => {
      if (that.data.currentTab == 0) {
        item.checked = flag
      } else {
        item.checked1 = flag
      }
      that.checkedSubMember(item.value, flag)
      if (item.subList) checkedSub(item.subList, flag)
    })
  },

  checkedSubMember: function (rid, flag) {
    let that = this
    let memList = this.data.departMemberMap[rid]
    let mids = []
    for (let key in memList) {
      mids.push(memList[key].id)
    }
    for (let i in that.data.departMemberMap) {
      for (let j in that.data.departMemberMap[i]) {
        let memberObj = that.data.departMemberMap[i][j]
        if (mids.indexOf(memberObj.id) != -1) {
          if (that.data.currentTab == 0) {
            memberObj.checked = flag
            console.log(memberObj.id, flag)
          } else {
            memberObj.checked1 = flag
          }
        }
      }
    }
  },

  checkedStackSubMember: function (l, flag) {
    let that = this
    if (l) {
      l.forEach((item) => {
        if (that.data.currentTab == 0) {
          item.checked = flag
        } else {
          item.checked1 = flag
        }
        if (item.subList) that.checkedStackSubMember(item.subList, flag)
      })
    }
  },

  findReginInStack: function (l, rid, flag) {
    let that = this
    if (l) {
      l.forEach(
        (item) => {
          if (item.value == rid) {
            if (that.data.currentTab == 0) {
              item.checked = flag
            } else {
              item.checked1 = flag
            }
            that.checkedStackSubMember(item.subList, flag)
          } else {
            that.findReginInStack(item.subList, rid, flag)
          }
        }
      )
    }
  },

  bindCheckRegion: function (e) {
    let that = this
    let {stackPeek} = that.data
    var rid = Number(e.currentTarget.dataset.rid)
    for (let i in stackPeek) {
      let regionObj = stackPeek[i]
      if (regionObj.value == rid) {
        let flag = true
        if (that.data.currentTab == 0) {
          flag = !regionObj.checked
          regionObj.checked = !regionObj.checked
        } else {
          flag = !regionObj.checked1
          regionObj.checked1 = !regionObj.checked1
        }
        that.checkedSubMember(regionObj.value, flag)
        that.findReginInStack(that.data.regionStack.data[0], regionObj.value, flag)
        if (regionObj.subList) {
          that.checkedSub(regionObj.subList, flag)
        }
      }
    }
    that.setData({
      stackPeek: stackPeek,
      regionStack: that.data.regionStack,
      departMemberMap: that.data.departMemberMap
    }, that.setMemberBox)
  }
})