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
    id: 0,
    reportInfo: null,
    is_create: false,
    departmentList: [],
    selectAll: [],
    memberList: {},
    choosedMember: [],
    didx: 0,
    //最多可上传的图片数量
    count: 3,
    imageList: [],
    image1List: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    var id = Number(options.id)
    if (id == 0) {
      var info = app.globalData.userInfo
      that.setData({
        id: id,
        reportInfo: {
          department: info.department,
          username: info.realname,
          time: util.formatTime(new Date())
        }
      })
    } else {
      api.phpRequest({
        url: 'report_list.php',
        data: {
          id: id
        },
        success: function (res) {
          console.log(res.data)
          that.setData({
            id: id,
            reportInfo: res.data,
            imageList: res.data.imgs,
            image1List: res.data.imgs1
          })
        }
      })
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
    console.log(imgList);
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
    console.log(that.data.departmentList)
    for (var i in that.data.departmentList) {
      that.data.memberList[i] = []
      that.data.selectAll.push(false)
      api.phpRequest({
        url: 'user.php',
        data: {
          departmentid: i
        },
        success: function (res) {
          that.data.memberList[i] = res.data
          that.setData({
            memberList: that.data.memberList,
            selectAll: that.data.selectAll
          })
        }
      })
    }
  },

  bindSelectAll: function (e) {
    var that = this
    var index = e.currentTarget.dataset.sidx
    var isAll = that.data.selectAll[index]
    that.data.selectAll[index] = !isAll
    var memberOjbs = that.data.memberList[index]
    for (var i in memberOjbs) {
      memberOjbs[i]["checked"] = !isAll
      console.log(that.data.selectAll)
      console.log(that.data.memberList)
    }
    that.setData({
      memberList: that.data.memberList,
      selectAll: that.data.selectAll
    })
  },

  bindSubmitForm: function (e) {
    var value = e.detail.value;
    var btnId = e.detail.target.dataset.id
    var that = this
    var url = btnId == "0" ? 'report_save.php' : 'report_submit.php'
    var data = {
      userid: wx.getStorageSync('userId'),
      task_time: new Date(),
      region: value.region,
      position: value.position,
      question: value.question,
      reason: value.reason,
      solve: value.solve,
      pjr_id: value.pjr_id,
      project_id: 0,
      industry_id: 0,
      report_id: 0
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
            that.uploadImg(url, data)
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
        imgsLength = 0,
        imgs1Length = 0,
        imgs = this.data.imageList,
        imgs1 = this.data.image1List
    var allImgs = imgs.concat(imgs1)
    for (var i in allImgs) {
      wx.uploadFile({
        url: api.API_HOST + "/fileup.php",
        filePath: allImgs[i],
        name: 'file',
        header: { "Content-Type": "multipart/form-data" },
        // formData: {
        //   //和服务器约定的token, 一般也可以放在header中
        //   'session_token': wx.getStorageSync('session_token')
        // },
        success: function (res) {
          console.log(res);
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
                if (i < imgsLength) {
                  uploadedImgs.append(res.data.imgpath)
                } else {
                  uploadedImgs1.append(res.data.imgpath)
                }
                if (i == imgs1Length) {
                  data['imgs'] = imgs
                  data['imgs1'] = imgs1
                  that.submitForm(url, data)
                }
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
    }
  },

  submitForm: function (url, data) {
    // 获取到位置信息后，调用api提交表单
    api.phpRequest({
      url: url,
      data: data,
      success: function (res) {
        wx.showToast({
          title: '提交成功',
          icon: 'success',
          success: function () {
            setTimeout(that.bindBackToIndex, 1500);
          }
        })
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
          console.log(res.data)
          that.setData({
            departmentList: util.formatDepartment(res.data)
          })
        }
      })
    } else {
      wx.showToast({
        title: "尚未发布",
        icon: 'none',
      })
    }
  }
})