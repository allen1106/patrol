// pages/report/report.js
var util = require("../../utils/util.js")
var api = require("../../utils/api.js")

//index.js
//获取应用实例
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: "",
    id: 0,
    reportInfo: null,
    isFb: 0,
    departmentList: [],
    projectList: null,
    proIdx: 0,
    systemList: null,
    sysIdx: 0,
    projectId: null,
    systemId: null,
    selectAll: [],
    memberList: {},
    didx: 0,
    //最多可上传的图片数量
    count: 3,
    imageList: [],
    image1List: [],
    fileUrl: '',
    comments: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    var id = Number(options.id)
    var isFb = Number(options.isFb)
    console.log(id, isFb)
    if (id == 0) {
      var info = app.globalData.userInfo
      that.setData({
        title: "发布巡检报告",
        id: id,
        reportInfo: {
          department: info.department,
          username: info.realname,
          time: util.formatTime(new Date())
        }
      }),
      that.fetchProjectList()
      that.fetchSystemList()
    } else {
      that.setData({
        title: "查看巡检报告",
      })
      api.phpRequest({
        url: 'report_list.php',
        data: {
          id: id
        },
        success: function (res) {
          console.log(res.data)
          that.setData({
            id: id,
            isFb: isFb,
            reportInfo: res.data,
            imageList: res.data.imgs.split(','),
            image1List: res.data.imgs1.split(',')
          })
        }
      })
      if (id != 0) {
        api.phpRequest({
          url: 'evaluate_list.php',
          data: {
            report_id: id
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
    }
    // 获取部门信息
    api.phpRequest({
      url: 'department.php',
      success: function (res) {
        console.log(res.data)
        that.setData({
          departmentList: util.formatDepartment(res.data)
        }, that.fetchMemberList)
      }
    })
    wx.setNavigationBarTitle({
      title: that.data.title
    })
  },


  chooseImage: function (e) {
    var index = Number(e.currentTarget.dataset.index)
    var that = this;
    wx.chooseImage({
      count: that.data.count - that.data.imageList.length,
      success: function (res) {
        if (index == "0") {
          that.setData({
            imageList: that.data.imageList.concat(res.tempFilePaths)
          })
        } else {
          that.setData({
            image1List: that.data.image1List.concat(res.tempFilePaths)
          })
        }
      }
    })
  },

  previewImage: function (e) {
    var index = Number(e.currentTarget.dataset.index)
    var current = e.target.dataset.src
    var imgList = index == "0" ? this.data.imageList : this.data.image1List
    wx.previewImage({
      current: current,
      urls: imgList
    })
  },

  delImg: function (e) {
    var current = e.target.dataset.src
    var index = Number(e.currentTarget.dataset.index)
    var imgList = index == "0" ? this.data.imageList : this.data.image1List
    var idx = imgList.indexOf(current)
    imgList.splice(idx, 1)
    if (index == "0") {
      this.setData({
        imageList: imgList
      })
    } else {
      this.setData({
        image1List: imgList
      })
    }
  },

  fetchMemberList: function () {
    var that = this
    for (var i in that.data.departmentList) {
      that.data.memberList[i] = []
      that.data.selectAll.push(false)
      that.fetchMember(i)
    }
  },

  fetchMember: function (i) {
    var that = this
    api.phpRequest({
      url: 'user.php',
      data: {
        departmentid: that.data.departmentList[i]
      },
      success: function (res) {
        that.data.memberList[i] = res.data
        that.setData({
          memberList: that.data.memberList,
          selectAll: that.data.selectAll
        })
      }
    })
  },

  bindSelectAll: function (e) {
    var that = this
    var index = e.currentTarget.dataset.sidx
    var isAll = that.data.selectAll[index]
    that.data.selectAll[index] = !isAll
    var memberOjbs = that.data.memberList[index]
    for (var i in memberOjbs) {
      memberOjbs[i]["checked"] = !isAll
    }
    that.setData({
      memberList: that.data.memberList,
      selectAll: that.data.selectAll
    })
  },

  bindSelect: function (e) {
    var that = this
    var value = e.currentTarget.dataset
    var memberOjbs = that.data.memberList[value.sidx]
    memberOjbs[value.midx]["checked"] = !memberOjbs[value.midx]["checked"]
    that.setData({
      memberList: that.data.memberList
    })
  },

  getCheckedMember: function (e) {
    var ret = []
    for (var i in this.data.memberList) {
      for (var j in this.data.memberList[i]) {
        if (this.data.memberList[i][j]["checked"]) {
          ret.push(this.data.memberList[i][j]["id"])
        }
      }
    }
    console.log(ret)
    return ret
  },

  validateInfo: function (data) {
    if (!data['question']) return '问题描述'
    if (!data['reason']) return '原因'
    if (!data['solve']) return '解决办法'
    if (!data['region']) return '区域'
    if (!data['position']) return '部位'
    return 'success'
  },

  bindSubmitForm: function (e) {
    var value = e.detail.value
    console.log(e.detail.value)
    var btnId = e.detail.target.dataset.id
    var that = this
    if (btnId == "2") {
      that.handleSuccess()
      return
    }
    var url = btnId == "0" ? 'report_save.php' : 'report_submit.php'
    var data = {
      userid: wx.getStorageSync('userId'),
      task_time: util.formatTime(new Date()),
      region: value.region,
      position: value.position,
      question: value.question,
      reason: value.reason,
      solve: value.solve,
      project_id: that.data.projectId,
      industry_id: that.data.systemId,
      report_id: that.data.id,
      pjr_id: that.getCheckedMember()
    }
    var valid = that.validateInfo(data)
    if (valid != "success") {
      wx.showToast({
        title: valid + '不能为空',
        icon: 'none',
      })
      return
    }
    // 获取位置信息，如果没有弹出提示框
    wx.getSetting({
      success: function (res) {
        wx.getLocation({
          type: 'gcj02',
          altitude: true,//高精度定位
          //定位成功，更新定位结果
          success (res) {
            data['lng'] = res.longitude,
            data['lat'] = res.latitude
            if (that.data.id != 0) {
              that.submitForm(url, data)
              return
            } else {
              that.uploadImg(url, data)
            }
          },
          //定位失败回调
          fail: function () {
            wx.showModal({
              title: '警告',
              content: '您没有授权获取位置信息，将无法提交报告。请10分钟后再次点击授权，或者删除小程序重新进入。',
              showCancel: false,
              confirmText: '我知道了'
            })
          },
          complete: function () {
            //隐藏定位中信息进度
            wx.hideLoading()
          }
        })
      }
    })
  },
  
  handleSuccess: function () {
    var that = this
    api.phpRequest({
      url: "report_result.php",
      data: {'report_id': that.data.id, 'userid': wx.getStorageSync('userId')},
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

  uploadImg: function (url, data) {
    var that = this
    var uploadedImgs = [],
        uploadedImgs1 = [],
        imgs = this.data.imageList,
        imgs1 = this.data.image1List
    var allImgs = imgs.concat(imgs1)
    if (allImgs.length == 0) {
      data['imgs'] = uploadedImgs
      data['imgs1'] = uploadedImgs1
      that.submitForm(url, data)
    } else {
      var i = 0
      that.uploadSingleImg(i, uploadedImgs, uploadedImgs1, imgs, imgs1, allImgs, url, data)
    }
  },

  uploadSingleImg: function (i, uploadedImgs, uploadedImgs1, imgs, imgs1, allImgs, url, data) {
    var that = this
    wx.uploadFile({
      url: api.API_HOST + "fileup.php",
      filePath: allImgs[i],
      name: 'imgs',
      success: function (res) {
        res.data = res.data.substring(1, res.data.length)
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
              if (i < imgs.length) {
                uploadedImgs.push(res.data.imgpath)
              } else {
                uploadedImgs1.push(res.data.imgpath)
              }
              if (i >= allImgs.length - 1) {
                data['imgs'] = uploadedImgs
                data['imgs1'] = uploadedImgs1
                that.submitForm(url, data)
              } else {
                i++
                that.uploadSingleImg(i, uploadedImgs, uploadedImgs1, imgs, imgs1, allImgs, url, data)
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

  bindBackToIndex: function () {
    wx.navigateBack({
      delta: 1
    })
  },

  download: function () {
    var that = this
    if (that.data.id) {
      api.phpRequest({
        url: 'download.php',
        data: {
          report_id: that.data.id
        },
        success: function (res) {
          that.setData({
            fileUrl: res.data.file
          }, that.openFile)
        }
      })
    } else {
      wx.showToast({
        title: "尚未发布",
        icon: 'none',
      })
    }
  },

  openFile: function (e) {
    var that = this
    wx.downloadFile({
      url: that.data.fileUrl,
      success (res) {
          wx.openDocument({
              filePath: res.tempFilePath
          })
      }
  })
  },

  fetchProjectList: function (fn1, fn2) {
    var that = this;
    api.phpRequest({
      url: 'project.php',
      data: {
        userid: wx.getStorageSync('userId')
      },
      success: function (res) {
        var list = res.data
        that.setData({
          projectList: list,
          projectId: list[0].project_id
        })
        if (fn1) {
          fn1(fn2)
        }
      }
    })
  },

  fetchSystemList: function (fn) {
    console.log("fetchSystemList")
    return new Promise(resolve => {
      var that = this;
      api.phpRequest({
        url: 'system.php',
        data: {
          userid: wx.getStorageSync('userId')
        },
        success: function (res) {
          var list = res.data
          that.setData({
            systemList: list,
            systemId: list[0].industry_id
          })
          if (fn) {
            fn()
          }
        }
      })
    })
  },
  bindProjectChange: function (e) {
    var idx = e.detail.value
    this.setData({
      proIdx: idx,
      projectId: this.data.projectList[idx].project_id
    })
  },

  bindSystemChange: function (e) {
    var idx = e.detail.value
    this.setData({
      sysIdx: e.detail.value,
      systemId: this.data.systemList[idx].industry_id
    })
  },
})