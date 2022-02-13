// pages/report/detail.js
var api = require("../../utils/api.js")
var plugin = requirePlugin("WechatSI")

let manager = plugin.getRecordRecognitionManager()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: null,
    formData: null,
    reportInfo: null,
    comments: null,
    comment: '',
    imageList: [],
    // form.php related
    formData: null,
    statusList: [{name: "不逾期", status: 0},{name: "逾期", status: 1},{name: "合理逾期", status: 2}],
    sid: 0
    // ---
  },

  fetchFromData: function () {
    let that = this
    api.phpRequest({
      url: 'form.php',
      success: function (res) {
        that.setData({
          formData: res.data,
        }, () => {
          for (let i in that.data.formData[3]) {
            let item = that.data.formData[3][i]
            item.imageList = []
            let imgs = that.data.reportInfo[item.name]
            if (imgs) {
              item.imageList = imgs.split(",")
            }
            that.setData({
              [`formData[3][` + i + `]`]: item
            })
          }
          for (let i in that.data.formData[0]) {
            let item = that.data.formData[0][i]
            api.phpRequest({
              url: item.apifile,
              success: function (res) {
                var list = res.data
                item.idx = 0
                for (let i in list) {
                  if (list[i].id == that.data.reportInfo[item.name]) {
                    item.value = list[i].name
                  }
                }
                that.setData({
                  [`formData[0][` + i + `]`]: item
                })
              }
            })
          }
          for (let i in that.data.formData[1]) {
            let item = that.data.formData[1][i]
            item.value = that.data.reportInfo[item.name]
            that.setData({
              [`formData[1][` + i + `]`]: item
            })
          }
          for (let i in that.data.formData[2]) {
            let item = that.data.formData[2][i]
            item.value = that.data.reportInfo[item.name]
            that.setData({
              [`formData[2][` + i + `]`]: item
            })
          }
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    let rid = options.id
    let menu = options.menu
    api.phpRequest({
      url: 'report_list.php',
      data: {
        userid: wx.getStorageSync('userId'),
        id: rid
      },
      success: function (res) {
        that.setData({
          id: rid,
          reportInfo: res.data,
          menu: menu
        }, that.fetchFromData)
      }
    })
    api.phpRequest({
      url: 'evaluate_list.php',
      data: {
        report_id: rid,
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
  },

  onShow: function () {
    let that = this
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

  previewImage: function (e) {
    let that = this
    var idx = Number(e.currentTarget.dataset.idx)
    var current = e.target.dataset.src
    var obj = that.data.formData[3][idx]
    wx.previewImage({
      current: current,
      urls: obj.imageList
    })
  },

  previewImage1: function (e) {
    var current = e.target.dataset.src
    var imgList = e.target.dataset.imgs
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

  bindSetComment: function (res) {
    var that = this
    that.bindInput = (res) => {
      console.log("====>>>>>>")
      console.log(res)
      that.setData({
        comment: res
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

  bindInputComment: function (e) {
    this.setData({
      comment: e.detail.value
    })
  },

  bindBackToIndex: function () {
    wx.navigateBack({
      delta: 1
    })
  },

  bindSubmitForm: function (e) {
    var that = this,
        url = that.data.menu == 3 ? 'evaluate_save.php' : 'report_reject.php'

    var data = {
      userid: wx.getStorageSync('userId'),
      report_id: that.data.id,
      content: that.data.comment
    }
    if (!data['content'] || !that.data.imageList) {
      wx.showToast({
        title: '请输入评价内容或上传图片',
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
            comment: ''
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
  },

  handleSuccess: function () {
    var that = this
    api.phpRequest({
      url: "report_result.php",
      data: {
        'project_id': that.data.id,
        'userid': wx.getStorageSync('userId')
      },
      method: 'post',
      header: {'content-type': 'application/x-www-form-urlencoded'},
      success: function (res) {
        if (res.data.status == 1) {
          wx.showToast({
            title: '处理成功',
            icon: 'success',
            success: function () {
              setTimeout(that.bindBackToIndex, 1500);
            }
          })
        } else {
          wx.showToast({
            title: '处理失败',
            icon: 'none'
          })
        }
      }
    })
  },

  handleDelete: function () {
    var that = this
    api.phpRequest({
      url: "report_delete.php",
      data: {
        'report_id_s': that.data.id,
      },
      header: {'content-type': 'application/x-www-form-urlencoded'},
      success: function (res) {
        if (res.data.status == 1) {
          wx.showToast({
            title: '删除成功',
            icon: 'success',
            success: function () {
              setTimeout(that.bindBackToIndex, 1500);
            }
          })
        } else {
          wx.showToast({
            title: '删除失败',
            icon: 'none'
          })
        }
      }
    })
  },
  navToEdit: function () {
    wx.navigateTo({
      url: '/pages/report/report?id=' + this.data.id + '&delta=' + 2,
    })
  },
  navToMember: function () {
    wx.navigateTo({
      url: '/pages/tasklist/member?stype=1&idstr=' + this.data.id,
    })
  },
  bindStatusChange: function (e) {
    var idx = e.detail.value
    var that = this
    that.setData({
      sid: that.data.statusList[idx].status
    }, that.handleOverdue)
  },
  handleOverdue: function () {
    var that = this
    api.phpRequest({
      url: "report_overdue.php",
      data: {
        userid: wx.getStorageSync('userId'),
        report_id: that.data.id,
        overdue: that.data.sid
      },
      header: {'content-type': 'application/x-www-form-urlencoded'},
      success: function (res) {
        if (res.data.status == 1) {
          wx.showToast({
            title: '处理成功',
            icon: 'success',
            success: function () {
              setTimeout(that.bindBackToIndex, 1500);
            }
          })
        } else {
          wx.showToast({
            title: '处理失败',
            icon: 'none'
          })
        }
      }
    })
  },
})