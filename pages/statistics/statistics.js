// pages/statistics/statistics.js
const { CascadedPickerView } = require('../../components/cascaded-picker-view/cascaded-picker-view.js')

var api = require("../../utils/api.js")
var util = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // winWidth: 0,
    // winHeight: 0,
    userId: wx.getStorageSync('userId'),
    startDate: "开始时间",
    endDate: "结束时间",
    itemList: null,
    projectList: [{"name": "选择项目", "project_id": 0}],
    proIdx: 0,
    projectId: 0,
    systemList: [{"name": "选择专业", "industry_id": 0}],
    sysIdx: 0,
    systemId: 0,
    reportSummary: null,
    sortBy: 0, // [总数，未解决，已解决，解决率]
    sortAsc: 0,
    fileUrl: "",
    // depart picker for choose depart
    rawRegionList: [],
    nextListMap: {},
    departId: 0,
    showPicker: false,
    // ---
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
      url: 'department.php',
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
                  if (parentValue && pickerIndex != 0) {
                    this.initProjectList(this.fetchProjectList)
                  }
                  this.fetchList()
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
    this.fetchRegionList()
    this.fetchSystemList()
    this.fetchList()
  },

  fetchProjectList: function () {
    var that = this
    // 获取项目列表
    // if (that.data.departId) {}
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
    }, that.fetchList)
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
    }, this.fetchList)
  },
  bindStartChange: function (e) {
    var date = e.detail.value
    this.setData({
      startDate: date
    }, this.fetchList)
  },

  bindEndChange: function (e) {
    var date = e.detail.value
    this.setData({
      endDate: date
    }, this.fetchList)
  },

  fetchList: function () {
    var that = this
    var data = {
      userid: wx.getStorageSync('userId')
    }
    if (that.data.departId) {data["department_id"] = that.data.departId}
    if (that.data.projectId != 0) {data["project_id"] = that.data.projectId}
    if (that.data.systemId != 0) {data["industry_id"] = that.data.systemId}
    if (that.data.startDate != "开始时间") {data["startDate"] = that.data.startDate}
    if (that.data.endDate != "结束时间") {data["endDate"] = that.data.endDate}
    console.log(data)
    api.phpRequest({
      url: 'statistics.php',
      data: data,
      success: function (res) {
        var list = res.data
        for (var i in list) {
          list[i].ratio = parseInt(list[i].ratio * 100)
          list[i].ratio1 = parseInt(list[i].ratio1 * 100)
        }
        that.setData({
          itemList: that.sortList(list)
        })
        that.fetchSummary(data)
      }
    })
  },

  fetchSummary: function (data) {
    var that = this
    api.phpRequest({
      url: 'statistics_total.php',
      data: data,
      success: function (res) {
        var summary = res.data
        summary.ratio = parseInt(summary.ratio * 100)
        summary.ratio1 = parseInt(summary.ratio1 * 100)
        that.setData({
          reportSummary: summary
        })
      }
    })
  },

  bindSortBy: function (e) {
    var that = this
    var sid = Number(e.target.dataset.sid)
    var sortAsc = null
    if (that.data.sortBy == sid) sortAsc = Number(!that.data.sortAsc)
    else sortAsc = 0
    that.setData({
      sortBy: sid,
      sortAsc: sortAsc
    }, () => {
      that.setData({
        itemList: that.sortList(that.data.itemList)
      })
    })
  },

  sortList: function (itemList) {
    var that = this
    var sortKey = ''
    var sortAsc = that.data.sortAsc
    if (that.data.sortBy == 0) {
      sortKey = 'number'
    } else if (that.data.sortBy == 1) {
      sortKey = 'number1'
    } else if (that.data.sortBy == 2) {
      sortKey = 'number2'
    } else if (that.data.sortBy == 3) {
      sortKey = 'ratio'
    } else if (that.data.sortBy == 4) {
      sortKey = 'ratio1'
    }
    console.log(sortKey)
    itemList.sort((x, y) => {
      return sortAsc ? x[sortKey] - y[sortKey] : y[sortKey] - x[sortKey]
    })
    return itemList
  },

  download: function () {
    var that = this
    var data = {
      userid: wx.getStorageSync('userId'),
      sort_by: that.data.sortBy,
      sort_asc: that.data.sortAsc
    }
    if (that.data.departId) {data["department_id"] = that.data.departId}
    if (that.data.projectId != 0) {data["project_id"] = that.data.projectId}
    if (that.data.systemId != 0) {data["industry_id"] = that.data.systemId}
    if (that.data.startDate != "开始时间") {data["startDate"] = that.data.startDate}
    if (that.data.endDate != "结束时间") {data["endDate"] = that.data.endDate}
    api.phpRequest({
      url: 'statistics_excel.php',
      data: data,
      success: function (res) {
        that.setData({
          fileUrl: res.data.file
        }, that.openFile)
      }
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
      filePath: wx.env.USER_DATA_PATH + '/' + fileName + '.xls',
      success (res) {
          wx.openDocument({
            filePath: wx.env.USER_DATA_PATH + '/' + fileName + '.xls',
            showMenu: true
          })
      }
  })
  },
})