// pages/report/report.js
const { CascadedPickerView } = require('../../components/cascaded-picker-view/cascaded-picker-view.js');
var util = require("../../utils/util.js")
var api = require("../../utils/api.js");
var plugin = requirePlugin("WechatSI")

let manager = plugin.getRecordRecognitionManager()

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
    projectList: [{"name": "请选择项目", "project_id": 0}],
    proIdx: 0,
    projectId: 0,
    systemList: [{"name": "请选择专业", "industry_id": 0}],
    sysIdx: 0,
    systemId: 0,
    //最多可上传的图片数量
    count: 3,
    imageList: [],
    image1List: [],
    fileUrl: '',
    showMember: 0,
    currentTab: 0,
    lng: 0,
    lat: 0,
    // depart picker for choose depart
    rawRegionList: [],
    nextListMap: {},
    departId: 0,
    showPicker: false,
    // ---
    // depart stack for choose member
    regionStack: null,
    stackPeek: null,
    stackLen: 0,
    // ---
    // member related
    departMemberMap: {},
    memberBox1: null,
    memberBox2: null,
    memberDepartId: 0,
    // ---
    // form.php related
    formData: null
    // ---
  },

  move:function(){},

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
      }
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

  fetchRegionList: function () {
    let that = this

    // 获取部门信息
    api.phpRequest({
      url: 'department_1.php',
      success: function (res) {
        that.convertList(res.data)
        that.flatList(res.data, {})
        that.setData({
          rawRegionList: res.data
        }, () => {
          if (that.data.id == 0 && app.globalData.departId) {
            that.setData({
              departId: app.globalData.departId
            }, that.fetchProjectList)
          }
          if (that.data.id != 0) {
            that.setData({
              departId: that.data.reportInfo.department_id
            }, that.fetchProjectList)
          }
          that.initAreaPicker()
        })
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
        // that.flatList(res.data, {})
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

  showPicker: function () {
    this.setData({
      showPicker: true
    })
  },

  hidePicker: function () {
    this.setData({
      showPicker: false
    })
  },

  initAreaPicker: function() {
    this.areaPicker = new CascadedPickerView(
        this,     // 页面对象
        'areaPickerData',   // 关联的页面数据键值（即页面对象 data 属性中代表 cascaded-picker 对象数据的字段名）
        {
            promptText: '-请选择-',    // 默认选择器的提示文本

            pickerCount: 1,     // 初始的选择器数量
            // initValues: ['450000'],   // 初始的选择器值
            loadOptionsMethod: (obj, parentValue, pickerIndex, callback) => {    // 加载指定选择器选项集合的方法
                // 方法参数说明：
                // obj - 代表当前级联选择器对象。
                // parentValue - 上一级选择器选定的项目的值，根据该值读取关联的数据。
                // pickerIndex - 代表当前要加载选项数据的选择器的索引。
                // callback - 数据加载完成后的回调方法，该方法接受一个代表选项集合的参数，选项集合中的选项需转换为 cascaded-picker 所识别的标准格式，即：
                //     {
                //         text: '文本',
                //         value: '值'
                //     }
                // 根据需要实现相应的加载选择器选项数据的逻辑。
                if (parentValue) {
                  this.setData({
                    departId: parentValue
                  }, () => {
                    if (parentValue) {
                      this.initProjectList(this.fetchProjectList)
                    }
                  })
                }
                if (pickerIndex === 0) {    // 读取第一级选择器选项
                    callback(this.data.rawRegionList);
                    return;
                }
                
                if (!parentValue) {
                    callback(null);
                    return;
                }

                let curObj = this.data.nextListMap[parentValue]
                if (curObj) {
                  callback(curObj.subList)
                  return
                }

                callback(null);
            },
        }
    );
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
        that.data.departMemberMap[departId] = res.data
        that.setData({
          departMemberMap: that.data.departMemberMap,
        }, that.setMemberBox)
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

  fetchFromData: function () {
    let that = this
    api.phpRequest({
      url: 'form.php',
      success: function (res) {
        that.setData({
          formData: res.data,
        }, () => {
          for (let i in that.data.formData[0]) {
            let item = that.data.formData[0][i]
            let dataList = [
              {"name": item.title, "id": 0}
            ]
            api.phpRequest({
              url: item.apifile,
              success: function (res) {
                var list = res.data
                item.list = dataList.concat(list)
                item.idx = 0
                if (that.data.id != 0) {
                  for (let i in item.list) {
                    if (item.list[i].id == that.data.reportInfo[item.name + '_id']) {
                      item.idx = i
                    }
                  }
                }
                that.setData({
                  [`formData[0][` + i + `]`]: item
                })
              }
            })
          }
          for (let i in that.data.formData[3]) {
            let item = that.data.formData[3][i]
            item.imageList = []
            if (that.data.id != 0) {
              let imgs = that.data.reportInfo[item.name]
              if (imgs) {
                item.imageList = imgs.split(",")
              }
            }
            that.setData({
              [`formData[3][` + i + `]`]: item
            })
          }
          for (let i in that.data.formData[1]) {
            let item = that.data.formData[1][i]
            if (that.data.id != 0) {
              item.value = that.data.reportInfo[item.name]
              that.setData({
                [`formData[1][` + i + `]`]: item
              })
            }
            if (app.globalData.formData) {
              let d = app.globalData.formData[1].filter((x) => x.name == item.name)[0]
              item.value = d.value
              that.setData({
                [`formData[1][` + i + `]`]: item
              })
            }
          }
          for (let i in that.data.formData[2]) {
            let item = that.data.formData[2][i]
            if (that.data.id != 0) {
              item.value = that.data.reportInfo[item.name]
              that.setData({
                [`formData[2][` + i + `]`]: item
              })
            }
            if (app.globalData.formData) {
              let d = app.globalData.formData[2].filter((x) => x.name == item.name)[0]
              item.value = d.value
              that.setData({
                [`formData[2][` + i + `]`]: item
              })
            }
          }
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    var id = Number(options.id)
    var delta = Number(options.delta)
    var info = app.globalData.userInfo
    if (id == 0) {
      that.setData({
        title: "发布巡检报告",
        id: id,
        reportInfo: {
          realname: info.realname,
          task_time: util.formatTime(new Date())
        },
      }),
      that.fetchRegionList()
      that.initMemberList()
      that.fetchSystemList()
      that.fetchFromData()
    } else {
      api.phpRequest({
        url: 'report_list.php',
        data: {
          userid: wx.getStorageSync('userId'),
          id: id
        },
        success: function (res) {
          console.log(res.data)
          let reportInfo = res.data
          that.setData({
            title: "发布巡检报告",
            id: id,
            delta: delta,
            reportInfo: reportInfo,
          }, () => {
            that.fetchRegionList()
            that.initMemberList()
            that.fetchSystemList()
            that.fetchFromData()
          })
        }
      })
    }
  },

  onShow: function () {
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
    if (that.data.needRefresh) {
      that.initMemberList()
    }
  },

  onUnload: function () {
    var that = this
    if (that.data.id == 0) {
      app.globalData.departId = Number(that.data.departId)
      app.globalData.proIdx = that.data.proIdx
      app.globalData.formData = that.data.formData
    }
  },

  chooseImage: function (e) {
    var that = this
    var idx = Number(e.currentTarget.dataset.idx)
    let obj = that.data.formData[3][idx]
    wx.chooseImage({
      count: that.data.count - obj.imageList.length,
      success: function (res) {
        obj.imageList = obj.imageList.concat(res.tempFilePaths)
        that.setData({
          [`formData[3][` + idx + `]`]: obj
        })
      }
    })
  },

  previewImage: function (e) {
    var idx = Number(e.currentTarget.dataset.idx)
    var current = e.target.dataset.src
    var obj = that.data.formData[3][idx]
    wx.previewImage({
      current: current,
      urls: obj.imgList
    })
  },

  delImg: function (e) {
    let that = this
    var current = e.target.dataset.src
    var idx = Number(e.currentTarget.dataset.idx)
    var obj = that.data.formData[3][idx]
    var idx = obj.imageList.indexOf(current)
    obj.imageList.splice(idx, 1)
    that.setData({
      [`formData[3][` + idx + `]`]: obj
    })
  },

  validateInfo: function (data, strict) {
    if (data['project_id'] == 0) return '部门和项目'
    if (data['industry_id'] == 0) return '专业'
    if (strict && data['pjr_id'].length <=0) return '推送给'

    for (let j in this.data.formData[0]) {
      let item = this.data.formData[0][j]
      if (strict && item.leixing && !item.idx) {
        return item.title
      }
      if (item.idx) {
        data[item.name] = item.list[item.idx].id
      }
    }

    for (let j in this.data.formData[1]) {
      let item = this.data.formData[1][j]
      if (strict && item.leixing && !item.value) {
        return item.title
      }
      if (item.value) {
        data[item.name] = item.value
      }
    }
    for (let j in this.data.formData[2]) {
      let item = this.data.formData[2][j]
      if (strict && item.leixing && !item.value) {
        return item.title
      }
      if (item.value) {
        data[item.name] = item.value
      }
    }
    for (let j in this.data.formData[3]) {
      let item = this.data.formData[3][j]
      if (strict && item.leixing && !item.imageList) {
        return item.title
      }
    }
    return 'success'
  },

  bindSubmitForm: function (e) {
    var btnId = e.currentTarget.dataset.id
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
      department_id: that.data.departId,
      project_id: that.data.projectId,
      industry_id: that.data.systemId,
      pjr_id: pjr_id,
      csr_id: csr_id
    }
    var valid = that.validateInfo(data, btnId == "1")
    if (valid != "success") {
      wx.showToast({
        title: valid + '不能为空',
        icon: 'none',
      })
      return
    }
    let userinfo = app.globalData.userInfo
    console.log(data)
    if (data['pjr_id'].length > userinfo.number || data['csr_id'].length > userinfo.number) {
      wx.showToast({
        title: '推送给人数不能超过' + userinfo.number + '人',
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

  uploadImg: function (url, data) {
    var that = this
    let imageForm = that.data.formData[3]
    let allRq = []
    for (let i in imageForm) {
      imageForm[i].uploadedImg = []
      for (let j in imageForm[i].imageList) {
        if (imageForm[i].imageList[j].startsWith(api.HTTP_HOST)) {
          imageForm[i].uploadedImg.push(imageForm[i].imageList[j])
        } else {
          allRq.push({
            "img": imageForm[i].imageList[j],
            "list": imageForm[i].uploadedImg
          })
        }
      }
    }
    if (allRq.length > 0) {
      that.uploadSingleImg(allRq, 0, url, data)
    } else {
      that.submitForm(url, data)
    }
  },

  uploadSingleImg: function (allRq, i, url, data) {
    let that = this
    wx.uploadFile({
      url: api.API_HOST + "fileup.php",
      filePath: allRq[i].img,
      name: 'imgs',
      success: function (res) {
        console.log("====>>>>1111")
        console.log(res.data)
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
              allRq[i].list.push(res.data.imgpath)
              if (i == allRq.length - 1) {
                that.submitForm(url, data)
              } else {
                that.uploadSingleImg(allRq, i + 1, url, data)
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
    for (let i in that.data.formData[3]) {
      let obj = that.data.formData[3][i]
      data[obj.name] = obj.uploadedImg
    }
    if (that.data.id != 0) {
      data["report_id"] = that.data.id
    }
    console.log(data)
    // 获取到位置信息后，调用api提交表单
    api.phpRequest({
      url: url,
      data: data,
      method: 'post',
      header: {'content-type': 'application/x-www-form-urlencoded'},
      success: function (res) {
        if (res.data.status == 1) {
          that.data.formData = null
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
      delta: this.data.delta || 1
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

  fetchProjectList: function () {
    var that = this
    // 获取项目列表
    api.phpRequest({
      url: 'project.php',
      data: {
        'department_id': that.data.departId
      },
      success: function (res) {
        var list = res.data
        list = that.data.projectList.concat(list)
        that.setData({
          projectList: list
        }, () => {
          if (that.data.id == 0 && app.globalData.proIdx) {
            let proObj = list[app.globalData.proIdx]
            that.setData({
              proIdx: app.globalData.proIdx,
              projectId: proObj.project_id
            })
          }
          if (that.data.id != 0) {
            let pidx = 0
            for (let i in list) {
              if (list[i].project_id == that.data.reportInfo.project_id) {
                pidx = i
              }
            }
            that.setData({
              proIdx: pidx,
              projectId: that.data.reportInfo.project_id
            })
          }
        })
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

  fetchSystemList: function (fn) {
    return new Promise(resolve => {
      var that = this
      api.phpRequest({
        url: 'industry.php',
        success: function (res) {
          var list = res.data
          list = that.data.systemList.concat(list)
          that.setData({
            systemList: list,
          }, () => {
            if (that.data.id == 0 && app.globalData.sysIdx != 0) {
              that.setData({
                sysIdx: app.globalData.sysIdx,
                systemId: list[app.globalData.sysIdx].industry_id
              })
            }
            if (that.data.id != 0) {
              let sidx = 0
              for (let i in list) {
                if (list[i].industry_id == that.data.reportInfo.industry_id) {
                  sidx = i
                }
              }
              that.setData({
                sysIdx: sidx,
                systemId: that.data.reportInfo.industry_id
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

  bindSystemChange: function (e) {
    var idx = e.detail.value
    var that = this
    that.setData({
      sysIdx: idx,
      systemId: this.data.systemList[idx].industry_id
    }, () => {
      app.globalData.sysIdx = idx
    })
  },

  bindPickerChange: function (e) {
    var pidx = e.detail.value
    let idx = e.currentTarget.dataset.idx
    var that = this
    that.setData({
      [`formData[0][` + idx + `].idx`]: pidx,
    })
  },

  bindNavToAddGroup: function () {
    wx.navigateTo({
      url: '/pages/group/add?reback=1',
    })
  },

  setFormValue: function (name, value) {
    for(let i in this.data.formData) {
      for (let j in this.data.formData[i]) {
        if (this.data.formData[i][j].name == name) {
          this.data.formData[i][j].value = value
          this.setData({
            formData: this.data.formData
          })
        }
      }
    }
  },

  bindInputText: function (e) {
    let key = e.currentTarget.dataset.name
    this.setFormValue(key, e.detail.value)
  },

  bindSpeakText: function (e) {
    var that = this
    let key = e.currentTarget.dataset.name
    that.bindInput = (res) => {
      that.setFormValue(key, res)
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

  switchAssignTab: function (e) {
    let that = this
    let tabid = Number(e.currentTarget.dataset.tab)
    that.setData({currentTab: tabid})
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
    let pjr_ids = new Set()
    let csr_ids = new Set()
    
    for (let i in that.data.departMemberMap) {
      for (let j in that.data.departMemberMap[i]) {
        let memberObj = that.data.departMemberMap[i][j]
        if (memberObj.checked) {
          pjr_ids.add(memberObj.id)
        }
        if (memberObj.checked1) {
          csr_ids.add(memberObj.id)
        }
      }
    }
    return {'pjr_id': Array.from(pjr_ids), 'csr_id': Array.from(csr_ids)}
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
  }
})