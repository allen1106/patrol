// pages/tasklist/tasklist.js
var api = require("../../utils/api.js")
var util = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: "",
    userId: null,
    isEvaluate: 0,
    isFb: 1,
    submitList: null,
    page: 1,
    regionList: [{"name": "请选择公司", "department_id": 0}],
    regionIdx: 0,
    regionId: 0,
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
    statusList: [{"name": "请选择状态", "isFb": 3}, {"name": "已解决", "isFb": 2}, {"name": "待解决", "isFb": 1}],
    statusIdx: 0,
    startDate: "请选择开始时间",
    endDate: "请选择结束时间",
    showCheckbox: false,
    
    // 批量勾选和发布
    showAssign: 0,
    memberRegionList: [],
    curRegionIdx: 0,
    curDepartIdx: 0,
    showMember: 0,
    currentTab: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    var isFb = Number(options.isfb)
    var isEvaluate = Number(options.isEvaluate)
    console.log(isFb, isEvaluate)
    that.setData({
      isFb: isFb,
      isEvaluate: isEvaluate,
      userId: wx.getStorageSync('userId')
    })
    var title = ""
    if (isFb) {
      title += "已"
    } else {
      title += "待"
    }
    if (isEvaluate) {
      title += "处理列表"
    } else {
      title += "巡检任务列表"
    }
    that.setData({
      title: title
    })
    wx.setNavigationBarTitle({
      title: that.data.title
    })
    that.fetchRegionList()
    that.fetchSystemList()
    that.fetchQuesList()
  },

  onShow: function () {
    var that = this;
    that.fetchTaskList()
  },

  fetchRegionList: function () {
    var that = this
    // 获取部门信息
    api.phpRequest({
      url: 'department.php',
      success: function (res) {
        let regions = res.data
        let list = that.data.regionList.concat(regions)
        that.setData({
          regionList: list,
          memberRegionList: regions
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
        'department_id': that.data.regionId
      },
      success: function (res) {
        var list = res.data
        list = that.data.projectList.concat(list)
        that.setData({
          projectList: list
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
        })
      }
    })
  },

  fetchSystemList: function (fn) {
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
      if (that.data.regionIdx != 0) {
        that.initProjectList(that.fetchProjectList)
      } else {
        that.initProjectList()
      }
      that.fetchTaskList()
    })
  },

  bindProjectChange: function (e) {
    var idx = e.detail.value
    var that = this
    that.setData({
      proIdx: idx,
      projectId: this.data.projectList[idx].project_id
    }, () => {
      if (that.data.proIdx != 0) {
        that.initSubProjectList(that.fetchSubProjectList)
      } else {
        that.initSubProjectList()
      }
      that.fetchTaskList()
    })
  },

  bindSubProjectChange: function (e) {
    var idx = e.detail.value
    this.setData({
      subProIdx: idx,
      subProjectId: this.data.subProjectList[idx].project_sub_id
    }, this.fetchTaskList)
  },

  bindQuesChange: function (e) {
    var idx = e.detail.value
    this.setData({
      quesIdx: idx,
      quesId: this.data.quesList[idx].problem_id
    }, this.fetchTaskList)
  },

  initProjectList: function (fn) {
    this.setData({
      projectList: [{"name": "请选择项目", "project_id": 0}],
      proIdx: 0,
      projectId: 0
    }, () => {
      if (fn) { fn() }
    })
  },

  initSubProjectList: function (fn) {
    this.setData({
      subProjectList: [{"name": "请选择子项目", "project_sub_id": 0}],
      subProIdx: 0,
      subProjectId: 0
    }, () => {
      if (fn) { fn() }
    })
  },

  bindSystemChange: function (e) {
    var idx = e.detail.value
    this.setData({
      sysIdx: e.detail.value,
      systemId: this.data.systemList[idx].industry_id
    }, this.fetchTaskList)
  },

  bindStatusChange: function (e) {
    var idx = e.detail.value
    this.setData({
      statusIdx: e.detail.value,
      isFb: this.data.statusList[idx].isFb
    }, this.fetchTaskList)
  },

  bindStartChange: function (e) {
    var date = e.detail.value
    this.setData({
      startDate: date
    }, this.fetchTaskList)
  },

  bindEndChange: function (e) {
    var date = e.detail.value
    this.setData({
      endDate: date
    }, this.fetchTaskList)
  },

  fetchTaskList: function (concatFlag) {
    var that = this
    var data = {
      userid: that.data.userId,
      page: that.data.page,
      is_fb: that.data.isFb
    }
    console.log(that.data)
    if (that.data.regionIdx != 0) {data["department_id"] = that.data.regionId}
    if (that.data.projectId != 0) {data["project_id"] = that.data.projectId}
    if (that.data.subProjectId != 0) {data["project_sub_id"] = that.data.subProjectId}
    if (that.data.systemId != 0) {data["industry_id"] = that.data.systemId}
    if (that.data.quesId != 0) {data["problem_id"] = that.data.quesId}
    if (that.data.startDate != "请选择开始时间") {data["startDate"] = that.data.startDate}
    if (that.data.endDate != "请选择结束时间") {data["endDate"] = that.data.endDate}
    if (!concatFlag) {
      data["page"] = 1
    }
    api.phpRequest({
      url: that.data.isEvaluate ? 'evaluate.php' : 'report.php',
      data: data,
      success: function (res) {
        console.log(res)
        var list = res.data
        if (concatFlag) {
          list = that.data.submitList.concat(list)
        }
        that.setData({
          submitList: list
        })
      }
    })
  },
  
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var fetchWrapper = function () {
      this.fetchTaskList(true)
    }
    this.setData({
      page: this.data.page + 1
    }, fetchWrapper)
  },

  viewReport: function (e) {
    if (this.data.showCheckbox) return
    console.log(e.currentTarget.dataset.rid)
    var rid = e.currentTarget.dataset.rid
    var isFb = e.currentTarget.dataset.isfb
    if (this.data.isEvaluate) {
      isFb = this.data.isFb
    }
    console.log(rid, isFb)
    if (this.data.isEvaluate) {
      wx.navigateTo({
        url: '/pages/evaluate/evaluate?id=' + rid + '&isFb=' + isFb,
      })
    } else {
      wx.navigateTo({
        url: '/pages/report/report?id=' + rid + '&isFb=' + isFb,
      })
    }
  },

  showCheckbox: function () {
    this.setData({
      showCheckbox: true
    })
  },
  hideCheckbox: function () {
    this.setData({
      showCheckbox: false
    })
  },
  checkboxChange: function (e) {
    let that = this
    let oldReportIds = that.data.reportIds
    let submitList = that.data.submitList
    var rids = e.detail.value
    let oldReportId = oldReportIds && oldReportIds[oldReportIds.length - 1] || 0
    let newReportId = rids && rids[rids.length - 1] || 0
    let oldRegionId, newRegionId = 0
    for (let i in submitList) {
      if (submitList[i].id == oldReportId) oldRegionId = submitList[i].department_id
      if (submitList[i].id == newReportId) newRegionId = submitList[i].department_id
    }
    console.log("======")
    console.log(oldRegionId, newRegionId)
    this.setData({
      reportIds: rids,
      checkedRegionId: newRegionId
    }, () => {
      that.forceSelectManager(oldRegionId)
    })
  },
  bindBatchDownload: function () {
    var that = this
    var reportIds = that.data.reportIds.join(',')
    let fileType = 1
    wx.showModal({
      title: '下载',
      content: '请选择文件类型',
      cancelText: 'doc',
      cancelColor: '#576B95',
      confirmText: 'pdf',
      success (res) {
        if (res.confirm) {
          fileType = 1
        } else if (res.cancel) {
          fileType = 2
        }
        api.phpRequest({
          url: 'batch_download.php',
          data: {'report_id_s': reportIds, 'type': fileType},
          success: function (res) {
            that.hideCheckbox()
            that.setData({
              fileUrl: res.data.file
            }, () => {
              that.openFile(fileType)
            })
          }
        })
      }
    })
  },
  openFile: function (type) {
    var that = this
    let fileName = new Date().valueOf()
    let suffix = (type == 1) ? '.pdf' : '.doc'
    wx.downloadFile({
      url: that.data.fileUrl,
      filePath: wx.env.USER_DATA_PATH + '/' + fileName + suffix,
      success (res) {
          wx.openDocument({
            filePath: wx.env.USER_DATA_PATH + '/' + fileName + suffix,
            showMenu: true
          })
      }
    })
  },

  // 批量勾选和发布
  bindShowAssign: function () {
    this.setData({showAssign: 1})
  },

  hideShowAssign: function () {
    this.setData({showAssign: 0})
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
    this.setData({
      showMember: 0
    })
  },

  searchName: function (e) {
    let that = this
    let {curRegionIdx, curDepartIdx, memberRegionList} = that.data
    let memberBox = memberRegionList[curRegionIdx].departList[curDepartIdx].memberList
    let reg = e.detail.value
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
    var did = Number(that.data.checkedRegionId)

    for (let i in that.data.memberRegionList) {
      let depart = that.data.memberRegionList[i]
      for (let j in that.data.memberRegionList[i].departList) {
        for (let k in that.data.memberRegionList[i].departList[j].memberList) {
          let memberObj = that.data.memberRegionList[i].departList[j].memberList[k]
          
          if (depart.department_id == lastRegionId) {
            memberObj.checked = false
            memberObj.checked1 = false
          }

          if ((memberObj.flag == 1 && depart.department_id == did) || (memberObj.extra_depart.indexOf(did) != -1)) {
            memberObj.checked = true
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
    let {memberRegionList, checkedRegionId} = that.data
    for (let i in memberRegionList) {
      for (let j in memberRegionList[i].departList) {
        for (let k in memberRegionList[i].departList[j].memberList) {
          let memberObj = memberRegionList[i].departList[j].memberList[k]

          if (memberRegionList[i].department_id == checkedRegionId && memberObj.flag == 1 && (!memberObj.checked || !memberObj.checked1)) {
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
  },

  bindBatchPost: function () {
    let that = this
    let checkedMem = that.getCheckedMember()
    if (!checkedMem) return
    let {pjr_id, csr_id} = checkedMem
    let reportIds = that.data.reportIds.join(',')
    api.phpRequest({
      url: "report_release.php",
      data: {
        'report_id_s': reportIds,
        'userid': wx.getStorageSync('userId'),
        'pjr_id': pjr_id,
        'csr_id': csr_id
      },
      method: 'post',
      header: {'content-type': 'application/x-www-form-urlencoded'},
      success: function (res) {
        if (res.data.status == 1) {
          wx.showToast({
            title: '处理成功',
            icon: 'success',
            success: function () {
              that.hideShowAssign()
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
  }
})