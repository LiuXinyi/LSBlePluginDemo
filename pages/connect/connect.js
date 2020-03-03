//获取应用实例
import {
    addDevice,
    addEventListener,
    isBluetoothAvailable,
    removeDevice,
    startDeviceSync,
    stopDeviceSync
} from "../DeviceMananer";

const app = getApp();

const TEXTS=['待连接', '连接中...', '底层已连接', '已断开', '协议已连接','扫描中...']
Page({
  data: {
    deviceMac: '',
    deviceName: '',
    statusMsg: '',
    isBluetoothEnable: false,
    gattClient: null,
    logText: '',
    dataPackage: null,
    connectState: 0,
    scanResult: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("onload", JSON.stringify(options))
    let obj = JSON.parse(JSON.stringify(options));
    this.setData({
      deviceMac: obj.broadcastId,
      deviceName: obj.deviceName,
      connectId: obj.connectId
    });
      let self =this;
      //注册蓝牙连接监听
      addEventListener("bluetoothStateChange", (res) => {
          self.appendLogText(`蓝牙状态发生改变${JSON.stringify(res)}`);
      });
      //注册设备连接监听
      addEventListener("connectionStateChange", (device) => {
          self.appendLogText(`设备连接状态发现改变${JSON.stringify(device)}`);
          self.setData({statusMsg: TEXTS[device.status]})
          self.setData({connectState: device.status});

      });
      //注册数据回调监听
      addEventListener('dataChanged',
          (deviceMac, dataType, data, dataStr) => {

              self.appendLogText(dataStr);
          })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    //判断手机蓝牙是否可用
    if (isBluetoothAvailable()) {
      this.setData({
        isBluetoothEnable: true
      })
      //连接设备
      this.connectDevice();
    } else {
      //提示打开手机蓝牙
      this.showBlueoothStatus(false);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('onShow.......');
    this.appendLogText('onShow.......');

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('onHide.......');

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('onUnload.......');
    this.disconnectDevice();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('onPullDownRefresh.......');

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('onReachBottom.......');

  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    console.log('onShareAppMessage');
  },

  // 设置
  setup: function () {
    wx.navigateTo({
      url: '../setting/setting?broadcastId=' + this.data.deviceMac + '&deviceName=' + this.data.deviceName + '&connectId=' + this.data.connectId
    })
  },

  /**
   * private methods
   */
  //更新界面的提示信息
  updateStatusMessage: function (msg) {
    this.setData({
      statusMsg: msg
    });
  },

  //发起连接请求
  connectDevice: function () {
    // if (isBluetoothAvailable()) {
    //   this.appendLogText('请打开手机蓝牙');
    //   return;
    // }
    this.setData({
      isConnecting: true,
      connectState: 1,
      logText: ''
    });
      this.appendLogText('发起请求');

      this.updateStatusMessage("Connecting...");
    let mac = this.data.deviceMac;
    if (mac === null || mac === undefined || mac === '') {
      //重置当前mac
      mac = this.data.connectId;
      this.setData({deviceMac: mac})
    }
    addDevice({deviceName: this.data.deviceName, deviceMac: mac});
    //注册数据同步回调
    startDeviceSync();
  },

  //断开连接
  disconnectDevice: function () {
    this.setData({
      isConnecting: false,
      connectState: 0,
    })
    this.updateStatusMessage("Disconnect");
    let mac = this.data.deviceMac;
    removeDevice({deviceMac: mac})
      stopDeviceSync();
  },

  // 打印信息
  appendLogText: function (log) {
    this.setData({
      logText: this.data.logText + '\n' + log + '\n' + '----------------------' + '\n'
    })

  },
  // 显示手机当前的蓝牙状态
  showBlueoothStatus: function (enable) {
    if (enable) {
      this.setData({
        isBluetoothEnable: true,
      });
    } else {
      this.setData({
        isBluetoothEnable: false,
        statusMsg: '请打开手机蓝牙',
        isScanning: false
      })
    }
  },

  /**
   * 蓝牙模块代码
   */
  //  蓝牙状态改变监听
  registerBlueAdapterStatusChanage: function () {

  },

  //停止搜索
  stopSearch: function () {

  },
})