// pages/notify/add.js
var util = require("../../utils/util.js")
var api = require("../../utils/api.js")
var plugin = requirePlugin("WechatSI")

let manager = plugin.getRecordRecognitionManager()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: "",
    content: "",
    imageList: [],
    // depart stack for choose member
    currentTab: 0,
    regionStack: null,
    stackPeek: null,
    stackLen: 0,
    // ---
    // member related
    departMemberMap: {},
    memberDepartId: 0,
    showMember: false,
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
    this.initMemberList()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var userId = wx.getStorageSync('userId')
    var userBind = wx.getStorageSync('userBind')
    if (!userId || !userBind) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
    }

    var that = this
    manager.onStop = (res) => {
      that.bindInput(res.result)
    }

    manager.onStart = (res) => {
      wx.showToast({
        title: "正在聆听，松开结束语音",
        icon: 'none'
      })
    }
    manager.onError = (res) => {
      wx.showToast({
        title: '说话时间太短，请重试',
        icon: 'none'
      })
    }
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
    let memList = this.data.departMemberMap[rid]
    for (let key in memList) {
      if (this.data.currentTab == 0) {
        memList[key].checked = flag
      } else {
        memList[key].checked1 = flag
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
    var values = e.detail.value
    for (let i in stackPeek) {
      let regionObj = stackPeek[i]
      if (values.indexOf(regionObj.value) != -1) {
        if (that.data.currentTab == 0) {
          regionObj.checked = true
        } else {
          regionObj.checked1 = true
        }
        that.checkedSubMember(regionObj.value, true)
        that.findReginInStack(that.data.regionStack.data[0], regionObj.value, true)
        if (regionObj.subList) {
          that.checkedSub(regionObj.subList, true)
        }
      } else {
        if (that.data.currentTab == 0) {
          regionObj.checked = false
        } else {
          regionObj.checked1 = false
        }
        that.checkedSubMember(regionObj.value, false)
        that.findReginInStack(that.data.regionStack.data[0], regionObj.value, false)
        if (regionObj.subList) {
          that.checkedSub(regionObj.subList, false)
        }
      }
    }
    that.setData({
      stackPeek: stackPeek,
      regionStack: that.data.regionStack,
      departMemberMap: that.data.departMemberMap
    }, that.setMemberBox)
  },

  bindNavToAddGroup: function () {
    wx.navigateTo({
      url: '/pages/group/add?reback=1',
    })
  },

  bindBackToIndex: function () {
    wx.navigateBack({
      delta: 1
    })
  },
  bindSetContent: function (res) {
    var that = this
    that.bindInput = (res) => {
      that.setData({
        content: res
      })
    }
    manager.start({
      lang: "zh_CN"
    })
  },
  bindSetTitle: function (res) {
    var that = this
    that.bindInput = (res) => {
      that.setData({
        title: res
      })
    }
    manager.start({
      lang: "zh_CN"
    })
  },

  bindTouchUp: function () {
    manager.stop()
    wx.showToast({
      title: '正在解析……',
      icon: 'loading',
      duration: 2000
    })
  },
  bindInputContent: function (e) {
    this.setData({
      content: e.detail.value
    })
  },
  bindInputTitle: function (e) {
    this.setData({
      title: e.detail.value
    })
  },
  
  previewImage: function (e) {
    var index = Number(e.currentTarget.dataset.index)
    var current = e.target.dataset.src
    var imgList = index == "0" ? this.data.info.imageList : this.data.info.image1List
    wx.previewImage({
      current: current,
      urls: imgList
    })
  },

  chooseImage: function (e) {
    var that = this
    let imgList = that.data.imageList
    wx.chooseImage({
      count: 3 - imgList.length,
      success: function (res) {
        that.setData({
          imageList: that.data.imageList.concat(res.tempFilePaths)
        })
      }
    })
  },

  delImg: function (e) {
    var current = e.target.dataset.src
    var imgList = this.data.imageList
    var idx = imgList.indexOf(current)
    imgList.splice(idx, 1)
    this.setData({
      imageList: imgList
    })
  },


  bindSubmitForm: function (e) {
    var that = this,
        url = 'news_submit.php'

    let {pjr_id} = that.getCheckedMember()

    var data = {
      userid: wx.getStorageSync('userId'),
      title: that.data.title,
      content: that.data.content,
      pjr_id: pjr_id
    }
    if (!data['content'] || !that.data.imageList) {
      wx.showToast({
        title: '请输入内容或上传图片',
        icon: 'none',
      })
      return
    }
    if (!data['pjr_id']) {
      wx.showToast({
        title: '请选择通知成员',
        icon: 'none',
      })
      return
    }
    that.uploadImg(url, data)
  },

  uploadImg: function (url, data) {
    var that = this
    var uploadedImgs = [],
        imgs = this.data.imageList
    for (var i in imgs) {
      if (imgs[i].startsWith(api.HTTP_HOST)) {
        uploadedImgs.push(imgs.splice(i, 1))
      }
    }
    var allImgs = imgs
    if (allImgs.length == 0) {
      data['imgs'] = uploadedImgs
      that.submitForm(url, data)
    } else {
      var i = 0
      that.uploadSingleImg(i, uploadedImgs, imgs, allImgs, url, data)
    }
  },

  uploadSingleImg: function (i, uploadedImgs, imgs, allImgs, url, data) {
    var that = this
    wx.uploadFile({
      url: api.API_HOST + "fileup.php",
      filePath: allImgs[i],
      name: 'imgs',
      success: function (res) {
        if (typeof(res.data) != Object) {
          res.data = res.data.replace("\ufeff", "")
        }
        res.data = JSON.parse(res.data)
        if (res.statusCode != 200) {
          wx.showModal({
            title: '提示',
            content: '上传失败',
            showCancel: false
          })
          return;
        } else {
          switch (res.data.status) {
            case 1:
              uploadedImgs.push(res.data.imgpath)
              if (i >= allImgs.length - 1) {
                data['imgs'] = uploadedImgs
                that.submitForm(url, data)
              } else {
                i++
                that.uploadSingleImg(i, uploadedImgs, imgs, allImgs, url, data)
              }
              break
            default:
              wx.showModal({
                title: '提示',
                content: '上传失败',
                showCancel: false
              })
              return
          }
        }
      },
      complete: function () {
        wx.hideToast();  //隐藏Toast
      }
    })
  },

  submitForm: function (url, data) {
    var that = this
    // 获取到位置信息后，调用api提交表单
    api.phpRequest({
      url: url,
      data: data,
      method: 'post',
      header: {'content-type': 'application/x-www-form-urlencoded'},
      success: function (res) {
        if (res.data.status == 1) {
          that.setData({
            content: ''
          })
          wx.showToast({
            title: '提交成功',
            icon: 'success',
            success: function () {
              setTimeout(that.bindBackToIndex, 1500);
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
  }
})