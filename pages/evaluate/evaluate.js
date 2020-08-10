// pages/evaluate/evaluate.js
var api = require("../../utils/api.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: 0,
    isFb: 0,
    reportInfo: null,
    imageList: [],
    image1List: [],
    commentImgList: [],
    count: 3,
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
    that.setData({
      isFb: isFb
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
          reportInfo: res.data,
          imageList: res.data.imgs && res.data.imgs.split('|'),
          image1List: res.data.imgs1 && res.data.imgs1.split('|')
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
  },

  getImgList: function (index) {
    var objMap = {
      "0": this.data.imageList,
      "1": this.data.image1List,
      "2": this.data.commentImgList
    }
    return objMap[index]
  },

  previewImage: function (e) {
    var index = Number(e.currentTarget.dataset.index)
    var current = e.target.dataset.src
    var imgList = this.getImgList(index)
    console.log(index)
    if (index == "3") {
      var cidx = Number(e.currentTarget.dataset.cidx)
      console.log(cidx)
      console.log(this.data.comments[cidx])
      imgList = this.data.comments[cidx].evaluate_imgs
    }
    wx.previewImage({
      current: current,
      urls: imgList
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
        } else if (index == "1") {
          that.setData({
            image1List: that.data.image1List.concat(res.tempFilePaths)
          })
        } else {
          that.setData({
            commentImgList: that.data.commentImgList.concat(res.tempFilePaths)
          })
        }
      }
    })
  },

  delImg: function (e) {
    var current = e.target.dataset.src
    var index = Number(e.currentTarget.dataset.index)
    var imgList = this.getImgList(index)
    var idx = imgList.indexOf(current)
    imgList.splice(idx, 1)
    if (index == "0") {
      this.setData({
        imageList: imgList
      })
    } else if (index == "1") {
      this.setData({
        image1List: imgList
      })
    } else {
      this.setData({
        commentImgList: imgList
      })
    }
  },

  uploadImg: function (url, data) {
    var that = this
    var uploadedImgs = [],
        imgs = this.data.commentImgList
    if (imgs.length == 0) {
      data['imgs'] = uploadedImgs
      that.submitForm(url, data)
    } else {
      var i = 0
      that.uploadSingleImg(i, uploadedImgs, imgs, url, data)
    }
  },

  uploadSingleImg: function (i, uploadedImgs, imgs, url, data) {
    var that = this
    console.log(i, imgs)
    wx.uploadFile({
      url: api.API_HOST + "fileup.php",
      filePath: imgs[i],
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
              uploadedImgs.push(res.data.imgpath)
              if (i >= imgs.length - 1) {
                data['imgs'] = uploadedImgs
                that.submitForm(url, data)
              } else {
                i++
                that.uploadSingleImg(i, uploadedImgs, imgs, url, data)
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
    api.phpRequest({
      url: url,
      method: 'Post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: data,
      success: function (res) {
        if (res.data.status == 1) {
          wx.showToast({
            title: '提交成功',
            icon: 'success',
            success: function () {
              setTimeout(that.bindBack, 1500);
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

  bindSubmitForm: function (e) {
    var that = this
    var comment = e.detail.value.comment
    if (!comment) {
      wx.showToast({
        title: '评论不能为空',
        icon: 'none',
      })
      return
    }
    var url = 'evaluate_save.php'
    var data = {
      userid: wx.getStorageSync('userId'),
      report_id: that.data.id,
      content: comment
    }
    that.uploadImg(url, data)
  },
  
  bindBack: function () {
    wx.navigateBack({
      delta: 1
    })
  }
})