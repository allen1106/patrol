// pages/report/report.js
var util = require("../../utils/util.js")
var api = require("../../utils/api.js")

//index.js
//获取应用实例
const app = getApp()
console.log(app.globalData)

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
    regionList: ["请选择区域"],
    regionIdx: 0,
    projectList: [{"name": "请选择项目", "project_id": 0}],
    proIdx: 0,
    systemList: [{"name": "请选择系统", "industry_id": 0}],
    sysIdx: 0,
    projectId: 0,
    systemId: 0,
    selectAll: [],
    memberList: {},
    memberCheckedList: [],
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
      that.fetchRegionList()
      that.fetchSystemList()
      that.setData({
        regionIdx: app.globalData.regionIdx,
        proIdx: app.globalData.proIdx,
        sysIdx: app.globalData.sysIdx,
      })
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
            imageList: res.data.imgs ? res.data.imgs.split(',') : [],
            image1List: res.data.imgs1 ? res.data.imgs1.split(',') : []
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
    }
    // 获取部门信息
    api.phpRequest({
      url: 'department.php',
      success: function (res) {
        console.log(res.data)
        that.setData({
          departmentList: util.formatDepartment(res.data)
        }, that.fetchMemberListWrapper)
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

  fetchMemberListWrapper: function () {
    var that = this
    if (that.data.id != 0) {
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
    } else {
      that.fetchMemberList()
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
    var flag = 0
    for (var i in that.data.memberList[value.sidx]) {
      if (that.data.memberList[value.sidx][i].checked) {
        flag++
      }
    }
    that.data.selectAll[value.sidx] = that.data.memberList[value.sidx].length != 0 && that.data.memberList[value.sidx].length == flag
    that.setData({
      selectAll: that.data.selectAll
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
    if (!data['question']) return '标题'
    if (!data['reason']) return '原因'
    if (!data['solve']) return '解决办法'
    if (!data['region']) return '区域'
    if (!data['position']) return '部位'
    if (data['report_id'] == 0 && data['project_id'] == 0) return '区域和项目'
    if (data['report_id'] == 0 && data['industry_id'] == 0) return '系统'
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
    if (btnId == "3") {
      that.handleReject()
      return
    }
    if (btnId == "4") {
      that.handleDelete()
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
            // if (that.data.id != 0) {
            //   that.submitForm(url, data)
            //   return
            // } else {
            that.uploadImg(url, data)
            // }
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

  handleReject: function () {
    var that = this
    api.phpRequest({
      url: "report_reject.php",
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

  handleDelete: function () {
    var that = this
    api.phpRequest({
      url: "report_delete.php",
      data: {'report_id': that.data.id},
      method: 'post',
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

  uploadImg: function (url, data) {
    var that = this
    var uploadedImgs = [],
        uploadedImgs1 = [],
        imgs = this.data.imageList,
        imgs1 = this.data.image1List
    for (var i in imgs) {
      if (imgs[i].startsWith(api.HTTP_HOST)) {
        uploadedImgs.push(imgs.splice(i, 1))
      }
    }
    for (var i in imgs1) {
      if (imgs1[i].startsWith(api.HTTP_HOST)) {
        uploadedImgs1.push(imgs1.splice(i, 1))
      }
    }
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
        }, () => {
          if (that.data.regionIdx != 0) {
            that.fetchProjectList(() => {
              if (app.globalData.proIdx != 0) {
                that.setData({
                  proIdx: app.globalData.proIdx,
                  projectId: that.data.projectList[app.globalData.proIdx].project_id
                })
              }
            })
          }
        })
      }
    })
  },

  fetchProjectList: function (fn1, fn2) {
    var that = this;
    api.phpRequest({
      url: 'project.php',
      data: {
        userid: wx.getStorageSync('userId'),
        qymc: that.data.regionList[that.data.regionIdx]
      },
      success: function (res) {
        var list = res.data
        list = that.data.projectList.concat(list)
        that.setData({
          projectList: list
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
          list = that.data.systemList.concat(list)
          that.setData({
            systemList: list
          }, () => {
            if (that.data.sysIdx != 0) {
              that.setData({
                sysIdx: app.globalData.sysIdx,
                systemId: that.data.systemList[app.globalData.sysIdx].industry_id
              })
            }
          })
          if (fn) {
            fn()
          }
        }
      })
    })
  },

  initProjectList: function (fn) {
    this.setData({
      projectList: [{"name": "请选择项目", "project_id": 0}],
      proIdx: 0,
      projectId: 0
    }, () => {
      app.globalData.proIdx = 0
      if (fn) { fn() }
    })
  },

  bindRegionChange: function (e) {
    var idx = e.detail.value
    var that = this
    that.setData({
      regionIdx: idx
    }, () => {
      app.globalData.regionIdx = idx
      console.log(app.globalData)
      if (that.data.regionIdx != 0) {
        that.initProjectList(that.fetchProjectList)
      } else {
        that.initProjectList()
      }
    })
  },

  bindProjectChange: function (e) {
    var idx = e.detail.value
    this.setData({
      proIdx: idx,
      projectId: this.data.projectList[idx].project_id
    })
    app.globalData.proIdx = idx
  },

  bindSystemChange: function (e) {
    var idx = e.detail.value
    this.setData({
      sysIdx: e.detail.value,
      systemId: this.data.systemList[idx].industry_id
    })
    app.globalData.sysIdx = idx
  },
})