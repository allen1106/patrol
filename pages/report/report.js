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
    departmentList: {},
    departmentList1: {},
    regionList: [{"name": "请选择公司", "department_id": 0}],
    regionIdx: 0,
    regionId: 0,
    projectList: [{"name": "请选择项目", "project_id": 0}],
    proIdx: 0,
    projectId: 0,
    systemList: [{"name": "请选择专业", "industry_id": 0}],
    sysIdx: 0,
    systemId: 0,
    quesList: [{"name": "请选择问题类型", "ques_id": 0}],
    quesIdx: 0,
    quesId: 0,
    selectAll: {},
    memberList: {},
    memberCheckedList: [],
    selectAll1: {},
    memberList1: {},
    memberCheckedList1: [],
    title: "",
    solve: "",
    term: "",
    didx: 0,
    //最多可上传的图片数量
    count: 3,
    imageList: [],
    image1List: [],
    fileUrl: '',
    comments: [],
    checkboxDisable: false,
    rejectRes: ''
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
      that.fetchSystemList()
      that.fetchQuesList()
      that.setData({
        title: app.globalData.title,
        solve: app.globalData.solve,
        term: app.globalData.term,
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
              if (res.data[i].evaluate_list) {
                for (let j in res.data[i].evaluate_list) {
                  res.data[i].evaluate_list[j].evaluate_imgs = res.data[i].evaluate_list[j].evaluate_imgs && res.data[i].evaluate_list[j].evaluate_imgs.split(',')
                }
              }
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
      url: 'department_sub_list.php',
      success: function (res) {
        for (let i in res.data) {
          let key = res.data[i].department_id
          if (res.data[i].type == 0) {
            that.data.departmentList[key] = res.data[i]
          } else if (res.data[i].type == 1) {
            that.data.departmentList1[key] = res.data[i]
          } else {
            that.data.departmentList[key] = res.data[i]
            that.data.departmentList1[key] = res.data[i]
          }
        }
        that.setData({
          departmentList: that.data.departmentList,
          departmentList1: that.data.departmentList1,
        }, () => {
          that.fetchMemberListWrapper()
          that.fetchMemberListWrapper1()
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

  onUnload: function () {
    var that = this
    if (that.data.id == 0) {
      app.globalData.title = that.data.title
      app.globalData.solve = that.data.solve
      app.globalData.term = that.data.term
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
      if (app.globalData.members) {
        that.setData({
          memberList: app.globalData.members,
          selectAll: app.globalData.selectAll
        })
      } else {
        that.fetchMemberList()
      }
    }
  },

  fetchMemberListWrapper1: function () {
    var that = this
    if (that.data.id != 0) {
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
    } else {
      if (app.globalData.members1) {
        that.setData({
          memberList1: app.globalData.members1,
          selectAll1: app.globalData.selectAll1
        })
      } else {
        that.fetchMemberList1()
      }
    }
  },

  fetchMemberList: function () {
    var that = this
    for (var i in that.data.departmentList) {
      let key = that.data.departmentList[i].department_id
      that.data.memberList[key] = []
      that.data.selectAll[key] = false
      that.fetchMember(key)
    }
  },

  fetchMemberList1: function () {
    var that = this
    for (var i in that.data.departmentList1) {
      let key = that.data.departmentList1[i].department_id
      that.data.memberList1[key] = []
      that.data.selectAll1[key] = false
      that.fetchMember1(key)
    }
  },

  fetchMember: function (did) {
    var that = this
    api.phpRequest({
      url: 'user.php',
      data: {
        departmentid: did
      },
      success: function (res) {
        var flag = 0
        for (var j in res.data) {
          if (that.data.memberCheckedList.indexOf(res.data[j].id) != -1) {
            res.data[j].checked = true
            flag++
          }
        }
        that.data.selectAll[did] = res.data.length != 0 && res.data.length == flag
        that.data.memberList[did] = res.data
        that.setData({
          memberList: that.data.memberList,
          selectAll: that.data.selectAll
        }, () => {
          that.forceSelectManager(0)
        })
      }
    })
  },

  fetchMember1: function (did) {
    var that = this
    api.phpRequest({
      url: 'user.php',
      data: {
        departmentid: did
      },
      success: function (res) {
        var flag = 0
        for (var j in res.data) {
          if (that.data.memberCheckedList1.indexOf(res.data[j].id) != -1) {
            res.data[j].checked = true
            flag++
          }
        }
        that.data.selectAll1[did] = res.data.length != 0 && res.data.length == flag
        that.data.memberList1[did] = res.data
        that.setData({
          memberList1: that.data.memberList1,
          selectAll1: that.data.selectAll1
        }, () => {
          that.forceSelectManager(0)
        })
      }
    })
  },

  bindSelectAll: function (e) {
    var that = this
    var did = e.currentTarget.dataset.sidx
    var isAll = that.data.selectAll[did]
    that.data.selectAll[did] = !isAll
    var memberOjbs = that.data.memberList[did]
    for (var i in memberOjbs) {
      if (memberOjbs[i].disabled) {
        continue
      }
      memberOjbs[i]["checked"] = !isAll
    }
    that.setData({
      memberList: that.data.memberList,
      selectAll: that.data.selectAll
    })
  },

  bindSelectAll1: function (e) {
    var that = this
    var did = e.currentTarget.dataset.sidx
    var isAll = that.data.selectAll1[did]
    that.data.selectAll1[did] = !isAll
    var memberOjbs = that.data.memberList1[did]
    for (var i in memberOjbs) {
      if (memberOjbs[i].disabled) {
        continue
      }
      memberOjbs[i]["checked"] = !isAll
    }
    that.setData({
      memberList1: that.data.memberList1,
      selectAll1: that.data.selectAll1
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

  bindSelect1: function (e) {
    var that = this
    var value = e.currentTarget.dataset
    var memberOjbs = that.data.memberList1[value.sidx]
    memberOjbs[value.midx]["checked"] = !memberOjbs[value.midx]["checked"]
    that.setData({
      memberList1: that.data.memberList1
    })
    var flag = 0
    for (var i in that.data.memberList1[value.sidx]) {
      if (that.data.memberList1[value.sidx][i].checked) {
        flag++
      }
    }
    that.data.selectAll1[value.sidx] = that.data.memberList1[value.sidx].length != 0 && that.data.memberList1[value.sidx].length == flag
    that.setData({
      selectAll1: that.data.selectAll1
    })
  },

  forceSelectManager: function (lastRegionId) {
    var that = this
    var did = Number(that.data.regionId)
    for (var i in that.data.memberList1) {
      for (var j in that.data.memberList1[i]) {
        if (lastRegionId) {
          that.data.memberList1[i][j].checked = false
          that.data.memberList1[i][j].disabled = false
        }
        if ((did == i && that.data.memberList1[i][j].flag == 1) || that.data.memberList1[i][j].extra_depart.indexOf(did) != -1) {
          that.data.memberList1[i][j].checked = true
          that.data.memberList1[i][j].disabled = true
        }
      }
    }
    that.setData({
      memberList: that.data.memberList,
      memberList1: that.data.memberList1
    })
  },

  getCheckedMember: function (e) {
    var ret = []
    app.globalData.members = this.data.memberList
    app.globalData.selectAll = this.data.selectAll
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

  getCheckedMember1: function (e) {
    var ret = []
    app.globalData.members1 = this.data.memberList1
    app.globalData.selectAll1 = this.data.selectAll1
    for (var i in this.data.memberList1) {
      for (var j in this.data.memberList1[i]) {
        if (this.data.memberList1[i][j]["checked"]) {
          ret.push(this.data.memberList1[i][j]["id"])
        }
      }
    }
    console.log(ret)
    return ret
  },

  validateInfo: function (data) {
    if (!data['title']) return '问题简述'
    if (!data['term']) return '处理期限'
    if (data['report_id'] == 0 && data['project_sub_id'] == 0) return '公司和项目'
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
    var data = {
      userid: wx.getStorageSync('userId'),
      task_time: util.formatTime(new Date()),
      title: value.title,
      solve: value.solve,
      term: value.term,
      department_id: that.data.regionId,
      project_id: that.data.projectId,
      industry_id: that.data.systemId,
      problem_id: that.data.quesId,
      report_id: that.data.id,
      pjr_id: that.getCheckedMember(),
      csr_id: that.getCheckedMember1()
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
    let did = that.data.regionId
    let flag = false
    for (var i in that.data.memberList[did]) {
      if (that.data.memberList[did][i].flag == 1 && that.data.memberList[did][i].checked == false) {
        flag = true
      }
    }
    for (var i in that.data.memberList1[did]) {
      if (that.data.memberList1[did][i].flag == 1 && that.data.memberList1[did][i].checked == false) {
        flag = true
      }
    }
    if (flag) {
      wx.showToast({
        title: '必须勾选当前公司的负责人',
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
          app.globalData.solve = ''
          app.globalData.term = ''
          that.setData({
            title: '',
            solve: '',
            term: '',
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
          }, that.fetchProjectList)
        }
      }
    })
  },

  fetchProjectList: function () {
    var that = this
    // 获取项目列表
    api.phpRequest({
      url: 'project.php',
      data: {
        'department_id': that.data.regionId
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
    var lastRegionId = that.data.regionId
    that.setData({
      regionIdx: idx,
      regionId: that.data.regionList[idx].department_id
    }, () => {
      that.forceSelectManager(lastRegionId)
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
    var that = this
    that.setData({
      proIdx: idx,
      projectId: this.data.projectList[idx].project_id
    }, () => {
      app.globalData.proIdx = idx
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

  bindInputRejectRes: function (e) {
    this.setData({
      rejectRes: e.detail.value
    })
  }
})