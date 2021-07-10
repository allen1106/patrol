// pages/evaluate/evaluate.js
var api = require("../../utils/api.js")

var plugin = requirePlugin("WechatSI")

let manager = plugin.getRecordRecognitionManager()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: 0,
    isFb: 0,
    reportInfo: null,
    imageList: [],
    image1List: [],
    commentImgList: [],
    count: 3,
    comments: [],
    selectAll: [],
    memberList: {},
    memberCheckedList: [],
    selectAll1: [],
    memberList1: {},
    memberCheckedList1: [],
    commentContent: "",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    var id = Number(options.id)
    var isFb = Number(options.isFb)
    console.log(id, isFb)
    that.setData({
      isFb: isFb
    })
    api.phpRequest({
      url: 'report_list.php',
      data: {
        id: id,
        userid: wx.getStorageSync('userId')
      },
      success: function (res) {
        console.log(res.data)
        that.setData({
          id: id,
          reportInfo: res.data,
          imageList: res.data.imgs && res.data.imgs.split(','),
          image1List: res.data.imgs1 && res.data.imgs1.split(',')
        })
      }
    })
    if (id != 0) {
      api.phpRequest({
        url: 'evaluate_list.php',
        data: {
          report_id: id,
          // userid: wx.getStorageSync('userId')
        },
        success: function (res) {
          console.log(res.data)
          for (var i in res.data) {
            res.data[i].evaluate_imgs = res.data[i].evaluate_imgs && res.data[i].evaluate_imgs.split(',')
          }
          that.setData({
            comments: res.data,
          })
        }
      })
    }
    // 获取部门信息
    api.phpRequest({
      url: 'department_sub_list.php',
      success: function (res) {
        console.log(res.data)
        that.setData({
          departmentList: res.data
        }, () => {
          // that.fetchMemberListWrapper()
          // that.fetchMemberListWrapper1()
        })
      }
    })
  },

  onShow: function () {
    var that = this
    manager.onStop = (res) => {
      that.bindInput(res.result)
    }

    manager.onStart = (res) => {
      console.log("正在聆听", res)
      wx.showToast({
        title: "正在聆听，松开结束语音",
      })
    }
    manager.onError = (res) => {
      console.log("error msg", res.msg)
      wx.showToast({
        title: '说话时间太短，请重试',
      })
    }
  },


  getImgList: function (index) {
    var objMap = {
      "0": this.data.imageList,
      "1": this.data.image1List,
      "2": this.data.commentImgList
    }
    return objMap[index]
  },

  previewImage: function (e) {
    var index = Number(e.currentTarget.dataset.index)
    var current = e.target.dataset.src
    var imgList = this.getImgList(index)
    console.log(index)
    if (index == "3") {
      var cidx = Number(e.currentTarget.dataset.cidx)
      console.log(cidx)
      console.log(this.data.comments[cidx])
      imgList = this.data.comments[cidx].evaluate_imgs
    }
    wx.previewImage({
      current: current,
      urls: imgList
    })
  },

  chooseImage: function (e) {
    var index = Number(e.currentTarget.dataset.index)
    var that = this;
    wx.chooseImage({
      count: that.data.count - that.data.commentImgList.length,
      success: function (res) {
        that.setData({
          commentImgList: that.data.commentImgList.concat(res.tempFilePaths)
        })
      }
    })
  },

  delImg: function (e) {
    var current = e.target.dataset.src
    var index = Number(e.currentTarget.dataset.index)
    var imgList = this.getImgList(index)
    var idx = imgList.indexOf(current)
    imgList.splice(idx, 1)
    if (index == "0") {
      this.setData({
        imageList: imgList
      })
    } else if (index == "1") {
      this.setData({
        image1List: imgList
      })
    } else {
      this.setData({
        commentImgList: imgList
      })
    }
  },

  uploadImg: function (url, data) {
    var that = this
    var uploadedImgs = [],
        imgs = this.data.commentImgList
    if (imgs.length == 0) {
      data['imgs'] = uploadedImgs
      that.submitForm(url, data)
    } else {
      var i = 0
      that.uploadSingleImg(i, uploadedImgs, imgs, url, data)
    }
  },

  uploadSingleImg: function (i, uploadedImgs, imgs, url, data) {
    var that = this
    console.log(i, imgs)
    wx.uploadFile({
      url: api.API_HOST + "fileup.php",
      filePath: imgs[i],
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
              if (i >= imgs.length - 1) {
                data['imgs'] = uploadedImgs
                that.submitForm(url, data)
              } else {
                i++
                that.uploadSingleImg(i, uploadedImgs, imgs, url, data)
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
    api.phpRequest({
      url: url,
      method: 'Post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: data,
      success: function (res) {
        if (res.data.status == 1) {
          wx.showToast({
            title: '提交成功',
            icon: 'success',
            success: function () {
              setTimeout(that.bindBack, 1500);
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

  bindSubmitForm: function (e) {
    var that = this
    var comment = that.data.commentContent
    if (!comment) {
      wx.showToast({
        title: '评论不能为空',
        icon: 'none',
      })
      return
    }
    var url = 'evaluate_save.php'
    var data = {
      userid: wx.getStorageSync('userId'),
      report_id: that.data.id,
      content: comment
    }
    that.uploadImg(url, data)
  },

  
  fetchMemberListWrapper: function () {
    var that = this
    api.phpRequest({
      url: 'report_cs.php',
      data: {
        report_id: that.data.id
      },
      success: function (res) {
        console.log(res.data)
        that.setData({
          memberCheckedList: res.data
        }, that.fetchMemberList)
      }
    })
  },

  fetchMemberListWrapper1: function () {
    var that = this
    api.phpRequest({
      url: 'report_cs1.php',
      data: {
        report_id: that.data.id
      },
      success: function (res) {
        console.log(res.data)
        that.setData({
          memberCheckedList1: res.data
        }, that.fetchMemberList1)
      }
    })
  },

  fetchMemberList: function () {
    var that = this
    for (var i in that.data.departmentList) {
      that.data.memberList[i] = []
      that.data.selectAll.push(false)
      that.fetchMember(i)
    }
  },

  fetchMemberList1: function () {
    var that = this
    for (var i in that.data.departmentList) {
      that.data.memberList1[i] = []
      that.data.selectAll1.push(false)
      that.fetchMember1(i)
    }
  },

  fetchMember: function (i) {
    var that = this
    api.phpRequest({
      url: 'user.php',
      data: {
        departmentid: that.data.departmentList[i].department_id
      },
      success: function (res) {
        var flag = 0
        for (var j in res.data) {
          if (that.data.memberCheckedList.indexOf(res.data[j].id) != -1) {
            res.data[j].checked = true
            flag++
          }
        }
        that.data.selectAll[i] = res.data.length != 0 && res.data.length == flag
        that.data.memberList[i] = res.data
        that.setData({
          memberList: that.data.memberList,
          selectAll: that.data.selectAll
        })
      }
    })
  },

  fetchMember1: function (i) {
    var that = this
    api.phpRequest({
      url: 'user.php',
      data: {
        departmentid: that.data.departmentList[i].department_id
      },
      success: function (res) {
        var flag = 0
        for (var j in res.data) {
          if (that.data.memberCheckedList1.indexOf(res.data[j].id) != -1) {
            res.data[j].checked = true
            flag++
          }
        }
        that.data.selectAll1[i] = res.data.length != 0 && res.data.length == flag
        that.data.memberList1[i] = res.data
        that.setData({
          memberList1: that.data.memberList1,
          selectAll1: that.data.selectAll1
        })
      }
    })
  },

  // bindSelectAll: function (e) {
  //   var that = this
  //   var index = e.currentTarget.dataset.sidx
  //   var isAll = that.data.selectAll[index]
  //   that.data.selectAll[index] = !isAll
  //   var memberOjbs = that.data.memberList[index]
  //   for (var i in memberOjbs) {
  //     memberOjbs[i]["checked"] = !isAll
  //   }
  //   that.setData({
  //     memberList: that.data.memberList,
  //     selectAll: that.data.selectAll
  //   })
  // },

  // bindSelectAll1: function (e) {
  //   var that = this
  //   var index = e.currentTarget.dataset.sidx
  //   var isAll = that.data.selectAll1[index]
  //   that.data.selectAll1[index] = !isAll
  //   var memberOjbs = that.data.memberList1[index]
  //   for (var i in memberOjbs) {
  //     memberOjbs[i]["checked"] = !isAll
  //   }
  //   that.setData({
  //     memberList1: that.data.memberList1,
  //     selectAll1: that.data.selectAll1
  //   })
  // },

  // bindSelect: function (e) {
  //   var that = this
  //   var value = e.currentTarget.dataset
  //   var memberOjbs = that.data.memberList[value.sidx]
  //   memberOjbs[value.midx]["checked"] = !memberOjbs[value.midx]["checked"]
  //   that.setData({
  //     memberList: that.data.memberList
  //   })
  //   var flag = 0
  //   for (var i in that.data.memberList[value.sidx]) {
  //     if (that.data.memberList[value.sidx][i].checked) {
  //       flag++
  //     }
  //   }
  //   that.data.selectAll[value.sidx] = that.data.memberList[value.sidx].length != 0 && that.data.memberList[value.sidx].length == flag
  //   that.setData({
  //     selectAll: that.data.selectAll
  //   })
  // },

  // bindSelect1: function (e) {
  //   var that = this
  //   var value = e.currentTarget.dataset
  //   var memberOjbs = that.data.memberList1[value.sidx]
  //   memberOjbs[value.midx]["checked"] = !memberOjbs[value.midx]["checked"]
  //   that.setData({
  //     memberList1: that.data.memberList1
  //   })
  //   var flag = 0
  //   for (var i in that.data.memberList1[value.sidx]) {
  //     if (that.data.memberList1[value.sidx][i].checked) {
  //       flag++
  //     }
  //   }
  //   that.data.selectAll1[value.sidx] = that.data.memberList1[value.sidx].length != 0 && that.data.memberList1[value.sidx].length == flag
  //   that.setData({
  //     selectAll1: that.data.selectAll1
  //   })
  // },

  
  bindTouchUp: function () {
    var that = this
    manager.stop()
    wx.showToast({
      title: '正在解析……',
      icon: 'loading',
      duration: 2000
    })
  },

  bindSetComment: function (res) {
    var that = this
    that.bindInput = (res) => {
      console.log(res)
      that.setData({
        commentContent: res
      })
    }
    manager.start({
      lang: "zh_CN"
    })
  },

  bindInputComment: function (e) {
    this.setData({
      commentContent: e.detail.value
    })
  },
  
  bindBack: function () {
    wx.navigateBack({
      delta: 1
    })
  }
})