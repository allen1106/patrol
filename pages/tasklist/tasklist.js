// pages/tasklist/tasklist.js
const { CascadedPickerView } = require('../../components/cascaded-picker-view/cascaded-picker-view.js')
const app = getApp()
var api = require("../../utils/api.js")
var util = require("../../utils/util.js")

const menuTabStatusMap = {
  2: [11],
  3: [4, 5, 6, 7],
  4: [1, 2, 3],
  6: [8, 9, 10],
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: "",
    userId: null,
    isFb: 1,
    submitList: null,
    page: 1,

    projectList: [{"name": "请选择项目", "project_id": 0}],
    proIdx: 0,
    projectId: 0,
    systemList: [{"name": "请选择专业", "industry_id": 0}],
    sysIdx: 0,
    systemId: 0,

    statusList: [{"name": "请选择状态", "isFb": 3}, {"name": "已解决", "isFb": 2}, {"name": "待解决", "isFb": 1}],
    statusIdx: 0,
    startDate: "请选择开始时间",
    endDate: "请选择结束时间",

    tab: 0,
    
    // depart picker for choose depart
    rawRegionList: [],
    nextListMap: {},
    departId: 0,
    showPicker: false,
    // ---
    selectAll: false
  },

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

  fetchRegionList: function () {
    let that = this

    // 获取部门信息
    api.phpRequest({
      url: 'department_1.php',
      success: function (res) {
        that.convertList(res.data)
        that.setData({
          rawRegionList: res.data
        }, () => {
          that.flatList(that.data.rawRegionList, {})
          const stack = new util.Stack()
          stack.push(that.data.rawRegionList)
          that.setData({
            regionStack: stack,
            stackPeek: stack.peek(),
            stackLen: stack.length()
          })
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
                  this.fetchTaskList()
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

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    let title = options.title,
        menu = Number(options.menu),
        tab = Number(options.tab)
    that.setData({
      title: title,
      menu: menu,
      tab: tab,
      userId: wx.getStorageSync('userId'),
    })
    wx.setNavigationBarTitle({
      title: title
    })
    that.fetchRegionList()
    that.fetchSystemList()
  },

  onShow: function () {
    var that = this;
    that.fetchTaskList()
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
        })
      }
    })
  },

  fetchSystemList: function (fn) {
    return new Promise(resolve => {
      var that = this;
      api.phpRequest({
        url: 'industry.php',
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

  bindProjectChange: function (e) {
    var idx = e.detail.value
    var that = this
    that.setData({
      proIdx: idx,
      projectId: this.data.projectList[idx].project_id
    }, that.fetchTaskList)
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

  switchTab: function (e) {
    let that = this
    let tabid = Number(e.currentTarget.dataset.tab)
    that.setData({tab: tabid}, that.fetchTaskList)
  },

  fetchTaskList: function (concatFlag) {
    var that = this
    var data = {
      userid: that.data.userId,
      page: that.data.page,
      is_fb: menuTabStatusMap[that.data.menu][that.data.tab]
    }
    console.log(that.data)
    if (that.data.departId) {data["department_id"] = that.data.departId}
    if (that.data.projectId != 0) {data["project_id"] = that.data.projectId}
    if (that.data.systemId != 0) {data["industry_id"] = that.data.systemId}
    if (that.data.startDate != "请选择开始时间") {data["startDate"] = that.data.startDate}
    if (that.data.endDate != "请选择结束时间") {data["endDate"] = that.data.endDate}
    if (!concatFlag) {
      data["page"] = 1
    }
    api.phpRequest({
      url: 'report.php',
      data: data,
      success: function (res) {
        var list = res.data
        if (concatFlag) {
          list = that.data.submitList.concat(list)
        }
        that.setData({
          submitList: list
        })
      }
    }),

    api.phpRequest({
      url: 'report_data.php',
      data: {
        userid: wx.getStorageSync('userId')
      },
      success: function (res) {
        that.setData({
          reportInfo: res.data
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
    console.log(e.currentTarget.dataset.rid)
    var rid = e.currentTarget.dataset.rid

    if (this.data.menu == 2) {
      wx.navigateTo({
        url: '/pages/report/report?id=' + rid,
      })
    } else {
      wx.navigateTo({
        url: '/pages/report/detail?menu=' + this.data.menu + '&id=' + rid,
      })
    }
  },

  checkboxChange: function (e) {
    let that = this
    var rids = e.detail.value
    let is_all = true
    for (let i in that.data.submitList) {
      let obj = that.data.submitList[i]
      if (rids.indexOf(obj.id) != -1) {
        obj.checked = true
      } else {
        obj.checked = false
        is_all = false
      }
    }
    that.setData({
      submitList: that.data.submitList,
      selectAll: is_all
    })
  },
  bindSelectAll: function () {
    let that = this
    for (let i in that.data.submitList) {
      let obj = that.data.submitList[i]
      if (that.data.selectAll) {
        obj.checked = false
      } else {
        obj.checked = true
      }
    }
    that.setData({
      submitList: that.data.submitList,
      selectAll: !that.data.selectAll
    })
  },
  batchAction: function (fn) {
    let that = this,
        reportIds = []
    for (let i in that.data.submitList) {
      let obj = that.data.submitList[i]
      if (obj.checked) {
        reportIds.push(obj.id)
      }
    }
    let idstr = reportIds.join(',')
    if (idstr) {
      fn(idstr)
    } else {
      wx.showToast({
        title: "请选择报告",
        icon: "none"
      })
    }
  },
  bindBatchDownload: function (e) {
    let that = this
    let flag = e.currentTarget.dataset.flag
    that.batchAction((idstr) => {
      api.phpRequest({
        url: 'batch_download.php',
        data: {
          'report_id_s': idstr,
          'flag': flag
        },
        success: function (res) {
          that.setData({
            fileUrl: res.data.file
          }, that.openFile)
        }
      })
    })
  },
  bindBatchDelete: function () {
    let that = this
    that.batchAction((idstr) => {
      api.phpRequest({
        url: 'report_delete.php',
        data: {
          'report_id_s': idstr,
        },
        success: function (res) {
          if (res.data.status == 1) {
            wx.showToast({
              title: "删除成功",
              icon: "success"
            })
            that.fetchTaskList()
          } else {
            wx.showToast({
              title: "删除失败，请重试！",
              icon: "none"
            })
          }
        }
      })
    })
  },
  bindBatchSubmit: function () {
    let that = this
    that.batchAction((idstr) => {
      wx.navigateTo({
        url: './member?idstr=' + idstr,
      })
    })
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
})