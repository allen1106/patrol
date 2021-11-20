// pages/register/register.js
const { CascadedPickerView } = require('../../components/cascaded-picker-view/cascaded-picker-view.js');

var api = require("../../utils/api.js")
var util = require("../../utils/util.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    rawRegionList: [],
    nextListMap: {},
    showPicker: false,
    extraDepart: [0],
    curDepartIdx: 0
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

  onLoad: function (e) {
    var that = this
    // 获取部门信息
    api.phpRequest({
      url: 'department.php',
      success: function (res) {
        that.convertList(res.data)
        that.setData({
          rawRegionList: res.data
        }, () => {
          that.flatList(that.data.rawRegionList, {})
        })
      }
    })
  },

  showPicker: function (e) {
    let didx = e.currentTarget.dataset.didx
    this.setData({
      curDepartIdx: didx,
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
            pickerCount: 1,     // 初始的选择器数量
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
                console.log("=====>>>>>>")
                let extraDepart = this.data.extraDepart
                console.log(extraDepart)
                console.log(parentValue)
                console.log(this.data.curDepartIdx)
                extraDepart[this.data.curDepartIdx] = parentValue
                this.setData({
                  extraDepart: extraDepart
                })
                console.log(extraDepart)
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

  bindAddDepart: function (e) {
    let that = this
    let extraDepart = that.data.extraDepart
    extraDepart.push(0)
    that.setData({
      extraDepart: extraDepart
    })
  },

  bindDelDepart: function (e) {
    let that = this
    let didx = e.currentTarget.dataset.didx
    let extraDepart = that.data.extraDepart
    extraDepart.splice(didx, 1)
    that.setData({
      extraDepart: extraDepart
    })
  },

  register: function (e) {
    var that = this
    var userId = wx.getStorageSync('userId')
    var value = e.detail.value
    var tipMsg = ""
    if (!value.realname) { tipMsg="姓名不能为空" }
    if (value.password != value.repeatpass) { tipMsg="两次密码不一致" }
    if (!value.password) { tipMsg="密码不能为空" }
    if (!value.tel) { tipMsg="手机号不能为空" }
    if (tipMsg) {
      wx.showToast({
        title: tipMsg,
        icon: 'none',
      })
      return
    }
    var data = {
      'userid': userId,
      'tel': value.tel,
      'password': value.password,
      'realname': value.realname,
      'cat_id_s': that.data.extraDepart
    }
    console.log("提交数据")
    console.log(data)
    api.phpRequest({
      url: 'regedit.php',
      method: 'Post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: data,
      success: function(res){
        var status = Number(res.data.status)
        console.log(res);
        switch (status) {
          case 1:
            wx.setStorageSync('userId', data['userid'])
            wx.setStorageSync('userBind', 1)
            wx.showToast({
              title: '注册成功',
              icon: 'success',
            })
            wx.navigateBack({
              delta: 2
            })
            break
          case 2:
            wx.showToast({
              title: '用户名已存在',
              icon: 'none',
            })
            break
          default:
            wx.showToast({
              title: '注册失败',
              icon: 'none',
            })
        }
      },
      fail: function(){
        wx.showToast({
          title: '注册失败',
          icon: 'none',
        })
        this.onLoad();
      }
    })
  },

  navigateToLogin: function (e) {
    wx.navigateBack({
      delta: 1
    })
  }
})