// pages/report/report.js
const { CascadedPickerView } = require('../../components/cascaded-picker-view/cascaded-picker-view.js');
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
    projectList: [{"name": "请选择项目", "project_id": 0}],
    proIdx: 0,
    projectId: 0,
    systemList: [{"name": "请选择专业", "industry_id": 0}],
    sysIdx: 0,
    systemId: 0,
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
    rejectRes: '',
    memberRegionList: [],
    curRegionIdx: 0,
    curDepartIdx: 0,
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
    memberDepartId: 0,
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
    }, this.initAreaPicker)
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
      url: 'department.php',
      success: function (res) {
        that.convertList(res.data)
        that.setData({
          rawRegionList: res.data
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
                this.setData({
                  departId: parentValue
                }, () => {
                  if (parentValue) {
                    this.initProjectList(this.fetchProjectList)
                  }
                })
                if (pickerIndex === 0) {    // 读取第一级选择器选项
                    callback(this.data.rawRegionList);
                    return;
                }
                
                if (!parentValue) {
                    callback(null);
                    return;
                }

                let curObj = this.data.nextListMap[parentValue]
                console.log(parentValue)
                console.log(curObj)
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
          username: info.realname,
          time: util.formatTime(new Date())
        },
      }),
      console.log(app.globalData)
      that.fetchRegionList()
      that.initMemberList()
      that.fetchSystemList()
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
      that.fetchRegionList()
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
      app.globalData.solve = that.data.solve
      app.globalData.term = that.data.term
    }
  },

  chooseImage: function (e) {
    var index = Number(e.currentTarget.dataset.index)
    var that = this
    let imgList = index == '0' ? that.data.imageList : that.data.image1List
    wx.chooseImage({
      count: that.data.count - imgList.length,
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

  validateInfo: function (data, strict) {
    if (data['report_id'] == 0 && data['project_id'] == 0) return '部门和项目'
    if (data['report_id'] == 0 && data['industry_id'] == 0) return '专业'
    if (!data['title']) return '标题'

    if (strict) {
      if (!data['reason']) return '原因'
      if (!data['solve']) return '解决办法'
      if (!data['position']) return '部位'
      if (!data['term']) return '处理期限'
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
      title: that.data.title,
      reason: that.data.reason,
      solve: that.data.solve,
      position: that.data.pos,
      term: that.data.term,
      department_id: that.data.departId,
      project_id: that.data.projectId,
      industry_id: that.data.systemId,
      pjr_id: pjr_id,
      csr_id: csr_id
    }
    console.log(data)
    var valid = that.validateInfo(data, btnId == "1")
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
      var that = this
      var userInfo = app.globalData.userInfo
      api.phpRequest({
        url: 'industry.php',
        success: function (res) {
          var list = res.data
          list = that.data.systemList.concat(list)
          let sysIdx = 0
          for (let i in list) {
            if (list[i].industry_id == userInfo.industry_id) {
              sysIdx = i
            }
          }
          that.setData({
            systemList: list,
            sysIdx: sysIdx,
            systemId: list[sysIdx].industry_id
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

  bindInputReason: function (e) {
    this.setData({
      reason: e.detail.value
    })
  },
  
  bindInputSolve: function (e) {
    this.setData({
      solve: e.detail.value
    })
  },
  
  bindInputPos: function (e) {
    this.setData({
      pos: e.detail.value
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
    }, that.bindSearchHandler)
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
    that.setData({departMemberMap: that.data.departMemberMap})
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
    })
  },

  delMember: function (e) {
    let that = this
    let {did, midx} = e.currentTarget.dataset
    let {departMemberMap, currentTab} = that.data
    let memberObj = departMemberMap[did][midx]

    if (currentTab == 0) {
      memberObj.checked = false
    } else {
      memberObj.checked1 = false
    }
    that.setData({departMemberMap: departMemberMap})
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
        if (memberObj.checked1) {
          ret.csr_id.push(memberObj.id)
        }
      }
    }
    return ret
  },

  bindNavToAddGroup: function () {
    wx.navigateTo({
      url: '/pages/group/add',
    })
  }
})