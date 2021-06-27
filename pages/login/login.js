// pages/login/login.js
var api = require("../../utils/api.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    bindInfo: false
  },

  onLoad: function (e) {
    var userId = wx.getStorageSync('userId')
    // 如果已经有userId，就进行绑定
    if (userId) {
      this.setData({
        bindInfo: true
      })
    }
  },

  login: function (e) {
    var that = this
    let code = ''
    wx.login({
      success (res) {
        code = res.code
      }
    })
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (info) => {
        api.phpRequest({
          url: 'login.php',
          data: {
            code: code,
            avatar_url: info.userInfo.avatarUrl,
            gender: info.userInfo.gender,
            nickname: info.userInfo.nickName
          },
          success: function (res) {
            console.log(res)
            wx.setStorageSync('userId', res.data.userid)
            wx.setStorageSync('userBind', res.data.bind)
            if (res.data.bind === 1) {
              wx.navigateBack({
                delta: 1
              })
            } else {
              that.setData({
                bindInfo: true
              })
            }
          }
        })
      }
    })
  },

  loginBind: function (e) {
    var value = e.detail.value;
    var userId = wx.getStorageSync('userId');
    if (!value.username) {
      wx.showToast({
        title: '用户名不能为空',
        icon: 'none',
      })
      return
    }
    if (!value.password) {
      wx.showToast({
        title: '密码不能为空',
        icon: 'none',
      })
      return
    }
    var data = {
      'userid': userId, 
      'username': value.username,
      'password': value.password
      }
    console.log("提交数据"+data);
    api.phpRequest({
      url: 'bind.php',
      method: 'Post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: data,
      success: function(res){
        var status = res.data.status
        switch (status) {
          case 1:
            wx.setStorageSync('userBind', 1)
            wx.showToast({
              title: '绑定成功',
              icon: 'success',
            })
            wx.navigateBack({
              delta: 1
            })
            break
          case 2:
            wx.showToast({
              title: '用户名或密码错误',
              icon: 'none',
            })
            break
          case 3:
            wx.showToast({
              title: '此用户名已经绑定其他账号',
              icon: 'none',
            })
            break
          case 4:
            wx.showToast({
              title: '您已绑定其他手机号',
              icon: 'none',
            })
            break
          default:
            wx.showToast({
              title: '绑定失败',
              icon: 'none',
            })
        }
      },
      fail: function(){
        wx.showToast({
          title: '绑定失败',
          icon: 'none',
        })
        this.onLoad();
      }
    })
  },

  navigateToRegister: function (e) {
    wx.navigateTo({
      url: '/pages/register/register',
    })
  },

  backToHome: function (e) {
    wx.navigateBack({
      delta: 2
    })
  }
})