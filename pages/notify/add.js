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
    regionStack: null,
    stackPeek: null,
    stackLen: 0,
    // ---
    // member related
    departMemberMap: {},
    memberDepartId: 0,
    showMember: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.fetchRegionList()
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
  fetchMember: function (departId) {
    let that = this
    api.phpRequest({
      url: 'user.php',
      data: {
        departmentid_id: departId
      },
      success: function (res) {
        if (that.data.id != 0) {
          // let {pjr_id, csr_id} = that.data.reportInfo
          // for (let i in res.data) {
          //   if (pjr_id && pjr_id.indexOf(res.data[i].id) != -1) {
          //     res.data[i].checked = true
          //   }
          //   if (csr_id && csr_id.indexOf(res.data[i].id) != -1) {
          //     res.data[i].checked1 = true
          //   }
          // }
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
      that.setData({
        showMember: true,
        memberDepartId: region.value
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

  chooseMemberRegion: function (idx) {
    let that = this
    let regionList = that.data.memberRegionList
    for (let i in regionList) {
      api.phpRequest({
        url: 'department_sub.php',
        data: {
          department_id: regionList[i].department_id
        },
        success: function (res) {
          regionList[i].departList = res.data
          for (let j in regionList[i].departList) {
            api.phpRequest({
              url: 'user.php',
              data: {
                departmentid: regionList[i].departList[j].department_sub_id
              },
              success: function (res) {
                // if (that.data.id != 0) {
                //   let {pjr_id, csr_id} = that.data.reportInfo
                //   for (let i in res.data) {
                //     if (pjr_id && pjr_id.indexOf(res.data[i].id) != -1) {
                //       res.data[i].checked = true
                //     }
                //     if (csr_id && csr_id.indexOf(res.data[i].id) != -1) {
                //       res.data[i].checked1 = true
                //     }
                //   }
                // }
                regionList[i].departList[j].memberList = res.data
                that.setData({
                  memberRegionList: regionList,
                })
              }
            })
          }
        }
      })
    }
    that.setData({
      curRegionIdx: idx
    })
  },

  bindClickDepart: function (e) {
    let that = this
    let didx = e.currentTarget.dataset.didx
    that.setData({
      curDepartIdx: didx,
      showMember: 1,
    })
  },

  bindHideMask: function (e) {
    this.searchHandler('')
    this.setData({
      showMember: false
    })
  },

  searchName: function (e) {
    let reg = e.detail.value
    this.searchHandler(reg)
  },

  searchHandler: function (reg) {
    let that = this
    for (let i in that.data.departMemberMap) {
      for (let j in that.data.departMemberMap[i]) {
        let memberObj = that.data.departMemberMap[i][j]
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
        if (values.indexOf(memberObj.id) == -1) {
          memberObj.checked = false
        } else {
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

        // if (memberRegionList[i].department_id == regionId && memberObj.flag == 1 && (!memberObj.checked || !memberObj.checked1)) {
        //   wx.showToast({
        //     title: '必须勾选当前公司的负责人',
        //     icon: 'none',
        //     })
        //     return null
        // }
        if (memberObj.checked) {
          ret.pjr_id.push(memberObj.id)
        }
      }
    }
    return ret
  },

  bindNavToAddGroup: function () {
    wx.navigateTo({
      url: '/pages/group/add',
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