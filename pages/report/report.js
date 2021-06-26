// pages/report/report.js
var util = require("../../utils/util.js")
var api = require("../../utils/api.js")
var plugin = requirePlugin("WechatSI")

let manager = plugin.getRecordRecognitionManager()

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
    regionList: [{"name": "请选择区域", "department_id": 0}],
    regionIdx: 0,
    regionId: 0,
    subRegionList: [{"name": "请选择公司", "sub_department_id": 0}],
    subRegionIdx: 0,
    subRegionId: 0,
    projectList: [{"name": "请选择项目", "project_id": 0}],
    proIdx: 0,
    projectId: 0,
    subProjectList: [{"name": "请选择子项目", "sub_project_id": 0}],
    subProIdx: 0,
    subProjectId: 0,
    systemList: [{"name": "请选择专业", "industry_id": 0}],
    sysIdx: 0,
    systemId: 0,
    quesList: [{"name": "请选择问题类型", "ques_id": 0}],
    quesIdx: 0,
    quesId: 0,
    title: "",
    position: "",
    solve: "",
    term: "",
    content: "",
    didx: 0,
    //最多可上传的图片数量
    count: 3,
    imageList: [],
    image1List: [],
    fileUrl: '',
    comments: [],
    checkboxDisable: false,
    memberRegionList: [],
    curRegionIdx: 0,
    curDepartIdx: 0,
    showMember: 0,
    currentTab: 0,
    rejectRes: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(app.globalData)
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
      console.log(app.globalData)
      that.fetchRegionList()
      that.fetchMemberRegionList()
      that.fetchSystemList()
      that.fetchQuesList()
      that.setData({
        title: app.globalData.title,
        position: app.globalData.position,
        solve: app.globalData.solve,
        term: app.globalData.term,
        content: app.globalData.content,
      })
    } else {
      that.setData({
        title: "查看巡检报告",
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
      that.fetchMemberRegionList()
    }
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

  onUnload: function () {
    var that = this
    if (that.data.id == 0) {
      app.globalData.title = that.data.title
      app.globalData.position = that.data.position
      app.globalData.solve = that.data.solve
      app.globalData.term = that.data.term
      app.globalData.content = that.data.content
    }
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

  validateInfo: function (data) {
    if (!data['title']) return '问题简述'
    if (!data['position']) return '部位'
    if (!data['term']) return '处理期限'
    if (data['report_id'] == 0 && data['project_sub_id'] == 0) return '区域和项目'
    if (data['report_id'] == 0 && data['industry_id'] == 0) return '专业'
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

    let checkedMem = that.getCheckedMember()
    if (!checkedMem) return
    let {pjr_id, csr_id} = checkedMem

    var data = {
      userid: wx.getStorageSync('userId'),
      task_time: util.formatTime(new Date()),
      position: value.position,
      title: value.title,
      solve: value.solve,
      term: value.term,
      content: value.content,
      department_id: that.data.regionId,
      department_sub_id: that.data.subRegionId,
      project_id: that.data.projectId,
      project_sub_id: that.data.subProjectId,
      industry_id: that.data.systemId,
      problem_id: that.data.quesId,
      report_id: that.data.id,
      pjr_id: pjr_id,
      csr_id: csr_id
    }
    console.log(data)
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
      data: {'report_id': that.data.id, 'userid': wx.getStorageSync('userId'), 'content': that.data.rejectRes || ''},
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
          app.globalData.title = ''
          app.globalData.position = ''
          app.globalData.solve = ''
          app.globalData.term = ''
          app.globalData.content = ''
          that.setData({
            title: '',
            position: '',
            solve: '',
            term: '',
            content: '',
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
    let fileName = new Date().valueOf()
    wx.downloadFile({
      url: that.data.fileUrl,
      header: {
        'content-type': 'application/word'
      },
      filePath: wx.env.USER_DATA_PATH + '/' + fileName + '.doc',
      success (res) {
          wx.openDocument({
            filePath: wx.env.USER_DATA_PATH + '/' + fileName + '.doc',
            showMenu: true
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
        var list = res.data
        list = that.data.regionList.concat(list)
        that.setData({
          regionList: list
        })
        if (app.globalData.regionIdx) {
          let regionObj = list[app.globalData.regionIdx]
          that.setData({
            regionIdx: app.globalData.regionIdx,
            regionId: regionObj.department_id
          }, that.fetchSubRegionList)
        }
      }
    })
  },

  fetchSubRegionList: function () {
    var that = this
    // 获取部门信息
    api.phpRequest({
      url: 'department_sub.php',
      data: {
        'department_id': that.data.regionId
      },
      success: function (res) {
        var list = res.data
        list = that.data.subRegionList.concat(list)
        that.setData({
          subRegionList: list
        }, () => {
          if (app.globalData.subRegionIdx != 0) {
            let subRegionObj = list[app.globalData.subRegionIdx]
            that.setData({
              subRegionIdx: app.globalData.subRegionIdx,
              subRegionId: subRegionObj.department_sub_id
            }, () => {
              that.fetchProjectList()
            })
          }
        })
      }
    })
  },

  fetchMemberRegionList: function () {
    var that = this
    // 获取部门信息
    api.phpRequest({
      url: 'department_sub_list.php',
      success: function (res) {
        var list = res.data
        that.setData({
          memberRegionList: list
        }, () => {
          // 初始化人员选择的pannel,并默认选中第一个region
          that.chooseMemberRegion(0)
        })
      }
    })
  },

  fetchProjectList: function () {
    var that = this
    // 获取项目列表
    api.phpRequest({
      url: 'project.php',
      data: {
        'department_sub_id': that.data.subRegionId
      },
      success: function (res) {
        var list = res.data
        list = that.data.projectList.concat(list)
        that.setData({
          projectList: list
        }, () => {
          if (app.globalData.proIdx) {
            let proObj = list[app.globalData.proIdx]
            that.setData({
              proIdx: app.globalData.proIdx,
              projectId: proObj.project_id
            }, that.fetchSubProjectList)
          }
        })
      }
    })
  },

  fetchSubProjectList: function () {
    var that = this
    // 获取子项目列表
    api.phpRequest({
      url: 'project_sub.php',
      data: {
        'project_id': that.data.projectId
      },
      success: function (res) {
        var list = res.data
        list = that.data.subProjectList.concat(list)
        that.setData({
          subProjectList: list
        }, () => {
          if (app.globalData.subProIdx) {
            let proObj = list[app.globalData.subProIdx]
            that.setData({
              subProIdx: app.globalData.subProIdx,
              subProjectId: proObj.project_sub_id
            })
          }
        })
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
            if (app.globalData.sysIdx != 0) {
              that.setData({
                sysIdx: app.globalData.sysIdx,
                systemId: list[app.globalData.sysIdx].industry_id
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

  fetchQuesList: function () {
    var that = this
    // 获取问题类型列表
    api.phpRequest({
      url: 'problem.php',
      success: function (res) {
        var list = res.data
        list = that.data.quesList.concat(list)
        that.setData({
          quesList: list
        }, () => {
          if (app.globalData.quesIdx != 0) {
            that.setData({
              quesIdx: app.globalData.quesIdx,
              quesId: list[app.globalData.quesIdx].problem_id
            })
          }
        })
      }
    })
  },

  bindRegionChange: function (e) {
    var idx = e.detail.value
    var that = this
    that.setData({
      regionIdx: idx,
      regionId: that.data.regionList[idx].department_id
    }, () => {
      app.globalData.regionIdx = idx
      console.log(app.globalData)
      if (that.data.regionIdx != 0) {
        that.initSubRegionList(that.fetchSubRegionList)
      } else {
        that.initSubRegionList()
      }
    })
  },

  bindSubRegionChange: function (e) {
    var idx = e.detail.value
    var that = this
    var lastRegionId = that.data.subRegionId
    that.setData({
      subRegionIdx: idx,
      subRegionId: that.data.subRegionList[idx].department_sub_id
    }, () => {
      app.globalData.subRegionIdx = idx
      that.forceSelectManager(lastRegionId)
      if (that.data.subRegionIdx != 0) {
        that.initProjectList(that.fetchProjectList)
      } else {
        that.initProjectList()
      }
    })
  },

  bindProjectChange: function (e) {
    var idx = e.detail.value
    var that = this
    that.setData({
      proIdx: idx,
      projectId: this.data.projectList[idx].project_id
    }, () => {
      app.globalData.proIdx = idx
      console.log(app.globalData)
      if (that.data.proIdx != 0) {
        that.initSubProjectList(that.fetchSubProjectList)
      } else {
        that.initSubProjectList()
      }
    })
  },

  bindSubProjectChange: function (e) {
    var idx = e.detail.value
    this.setData({
      subProIdx: idx,
      subProjectId: this.data.subProjectList[idx].project_sub_id
    })
    app.globalData.subProIdx = idx
  },

  initSubRegionList: function (fn) {
    this.setData({
      subRegionList: [{"name": "请选择公司", "department_id": 0}],
      subRegionIdx: 0,
      subRegionId: 0
    }, () => {
      app.globalData.subRegionIdx = 0
      if (fn) { fn() }
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

  initSubProjectList: function (fn) {
    this.setData({
      subProjectList: [{"name": "请选择子项目", "project_id": 0}],
      subProIdx: 0,
      subProjectId: 0
    }, () => {
      app.globalData.subProIdx = 0
      if (fn) { fn() }
    })
  },

  bindSystemChange: function (e) {
    var idx = e.detail.value
    this.setData({
      sysIdx: e.detail.value,
      systemId: this.data.systemList[idx].industry_id
    })
    app.globalData.sysIdx = idx
  },

  bindQuesChange: function (e) {
    var idx = e.detail.value
    this.setData({
      quesIdx: e.detail.value,
      quesId: this.data.quesList[idx].problem_id
    })
    app.globalData.quesIdx = idx
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
  
  bindSetPosition: function (res) {
    var that = this
    that.bindInput = (res) => {
      that.setData({
        position: res
      })
    }
    manager.start({
      lang: "zh_CN"
    })
  },
  
  bindSetSolve: function (res) {
    var that = this
    that.bindInput = (res) => {
      that.setData({
        solve: res
      }) 
    }
    manager.start({
      lang: "zh_CN"
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

  bindSetRejectRes: function (res) {
    var that = this
    that.bindInput = (res) => {
      that.setData({
        rejectRes: res
      })
    }
    manager.start({
      lang: "zh_CN"
    })
  },

  bindTouchUp: function () {
    var that = this
    manager.stop()
    wx.showToast({
      title: '正在解析……',
      icon: 'loading',
      duration: 2000
    })
  },

  bindInputTitle: function (e) {
    this.setData({
      title: e.detail.value
    })
  },
  
  bindInputPosition: function (e) {
    this.setData({
      position: e.detail.value
    })
  },
  
  bindInputSolve: function (e) {
    this.setData({
      solve: e.detail.value
    })
  },
  
  bindInputTerm: function (e) {
    this.setData({
      term: e.detail.value
    })
  },
  
  bindInputContent: function (e) {
    this.setData({
      content: e.detail.value
    })
  },

  bindInputRejectRes: function (e) {
    this.setData({
      rejectRes: e.detail.value
    })
  },

  switchAssignTab: function (e) {
    let that = this
    let tabid = Number(e.currentTarget.dataset.tab)
    that.setData({currentTab: tabid})
  },

  bindClickRegion: function (e) {
    let that = this
    let idx = e.currentTarget.dataset.idx
    that.setData({
      curRegionIdx: idx
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
                if (that.data.id != 0) {
                  let {pjr_id, csr_id} = that.data.reportInfo
                  for (let i in res.data) {
                    if (pjr_id && pjr_id.indexOf(res.data[i].id) != -1) {
                      res.data[i].checked = true
                    }
                    if (csr_id && csr_id.indexOf(res.data[i].id) != -1) {
                      res.data[i].checked1 = true
                    }
                  }
                }
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
      showMember: 0
    })
  },

  searchName: function (e) {
    let reg = e.detail.value
    this.searchHandler(reg)
  },

  searchHandler: function (reg) {
    let that = this
    let {curRegionIdx, curDepartIdx, memberRegionList} = that.data
    let memberBox = memberRegionList[curRegionIdx].departList[curDepartIdx].memberList
    for (let i in memberBox) {
      memberBox[i].hide = 0
      if (memberBox[i].realname.indexOf(reg) == -1) {
        memberBox[i].hide = 1
      }
    }
    that.setData({memberRegionList: memberRegionList})
  },

  bindPickMember: function (e) {
    var that = this
    var values = e.detail.value
    let {curRegionIdx, curDepartIdx, memberRegionList, currentTab} = that.data
    let memberBox = memberRegionList[curRegionIdx].departList[curDepartIdx].memberList
    for (let i in memberBox) {
      if (currentTab == 1) {
        memberBox[i].checked1 = false
      } else {
        memberBox[i].checked = false
      }

      for (let j in values) {
        if (memberBox[i].id === values[j]) {
          if (currentTab == 1) {
            memberBox[i].checked1 = true
          } else {
            memberBox[i].checked = true
          }
          break
        }
      }
    }
    that.setData({
      memberRegionList: memberRegionList,
    })
  },

  delMember: function (e) {
    let that = this
    let {ridx, didx, midx} = e.currentTarget.dataset
    let {memberRegionList, currentTab} = that.data
    if (currentTab == 1) {
      memberRegionList[ridx].departList[didx].memberList[midx].checked1 = false
    } else {
      memberRegionList[ridx].departList[didx].memberList[midx].checked = false
    }
    that.setData({memberRegionList: memberRegionList})
  },

  forceSelectManager: function (lastRegionId) {
    var that = this
    var did = Number(that.data.regionId)

    for (let i in that.data.memberRegionList) {
      let depart = that.data.memberRegionList[i]
      for (let j in that.data.memberRegionList[i].departList) {
        for (let k in that.data.memberRegionList[i].departList[j].memberList) {
          let memberObj = that.data.memberRegionList[i].departList[j].memberList[k]

          if (depart.department_id == lastRegionId) {
            // memberObj.checked = false
            memberObj.checked1 = false
          }

          if ((memberObj.flag == 1 && depart.department_id == did) || (memberObj.extra_depart.indexOf(did) != -1)) {
            // memberObj.checked = true
            memberObj.checked1 = true
          }
        }
      }
    }
    that.setData({
      memberRegionList: that.data.memberRegionList
    })
  },

  getCheckedMember: function () {
    let that = this
    let ret = {'pjr_id': [], 'csr_id': []}
    let {memberRegionList, regionId} = that.data
    for (let i in memberRegionList) {
      for (let j in memberRegionList[i].departList) {
        for (let k in memberRegionList[i].departList[j].memberList) {
          let memberObj = memberRegionList[i].departList[j].memberList[k]

          if (memberRegionList[i].department_id == regionId && memberObj.flag == 1 && (!memberObj.checked || !memberObj.checked1)) {
            wx.showToast({
              title: '必须勾选当前公司的负责人',
              icon: 'none',
              })
              return null
          }

          if (memberObj.checked) {
            ret.pjr_id.push(memberObj.id)
          }
          if (memberObj.checked1) {
            ret.csr_id.push(memberObj.id)
          }
        }
      }
    }
    return ret
  }
})