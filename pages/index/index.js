//index.js
import { addEventListener, isBluetoothAvailable, scanDevice, stopScan} from "../DeviceMananer";

const app = getApp();


// 蓝牙连接profiles
var TARGRT_DEVICE_NAME = "LS Band 5";
var TEST_DEVICE_MAC ='A4:C1:38:91:55:6E';//"F2:76:33:C7:35:32";//'A4:C1:38:91:55:6E';//

Page({
  data: {
    statusMsg: '',
    isBluetoothEnable: false,
    isScanning: false,
    isSelected: false,
    isScanCancel: false,
    scanResults: [{
      name: '测试My Mambo',
      broadcastId: 'F2:76:33:C7:35:32',
      connectId:'F2:76:33:C7:35:32'
    }],
    deviceIds: [], // 扫描到的设备ID列表

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log('index.js onReady.......');
    //注册蓝牙状态改变监听
    this.registerBlueAdapterStatusChanage();
    this.startSearch()

  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('index.js onHide.......');
    this.stopSearch();

  },
  //页面加载
  onLoad: function () {
    console.log('index.js onLoad.......');
  },

  onUnload: function () {
    //取消蓝牙状态监听回调
  },

  /**
   * page action 
   */

  //显示手机当前的蓝牙状态
  showBlueoothStatus: function (enable) {
    if (enable) {
      this.setData({
        isBluetoothEnable: true,
      });
    } else {
      this.setData({
        isBluetoothEnable: false,
        statusMsg: '提示: 请打开手机蓝牙',
        isScanning: false
      })
    }
  },

  //更新界面的提示信息
  updateStatusMessage: function (msg) {
    this.setData({
      statusMsg: msg
    });
  },


  //开始搜索
  startSearch: function () {
    this.updateStatusMessage("Scanning...");
    //清除缓存
    this.setData({
      scanResults: [],
      deviceIds:[],
      isScanning: true,
      isScanCancel: false
    });
    //开启扫描
    let that = this;
   let ret= scanDevice({
      broadcastNames: null,
      callback: (device) => {
        let broadcastId = device.broadcastId;
        let deviceName = device.deviceName;
        let scanResults= that.data.scanResults;
        let deviceIds=that.data.deviceIds;
        if (deviceIds.indexOf(device.id) < 0) {
          deviceIds.push(device.id);
          scanResults.push({
            name: deviceName,
            broadcastId: broadcastId,
            connectId: device.isSystemPaired ? device.id : broadcastId
          });
          that.setData({scanResults,deviceIds})
          //更新扫描结果提示
          that.updateStatusMessage('Scanning...' + that.data.scanResults.length);
        }
      }
    });
   if(ret!==true){
     this.showBlueoothStatus(isBluetoothAvailable())
   }
  },

  //停止搜索
  stopSearch: function () {
    this.updateStatusMessage("Scanned:" + this.data.scanResults.length);
    this.setData({
      scanResults: [],
      isScanning: false,
      isScanCancel: true
    });
    stopScan()
  },

  //扫描结果，目标设备选择
  selectDevice: function (e) {
    console.log("select device", JSON.stringify(e.currentTarget.dataset.text));
    this.setData({
      isSelected: true,
      isScanning: false,
      isScanCancel: true,
    });
    this.stopSearch();
    let obj = JSON.parse(JSON.stringify(e.currentTarget.dataset.text));
    let deviceName = obj.name;
    let broadcastId = obj.broadcastId;
    wx.navigateTo({
      url: '../connect/connect?broadcastId=' + broadcastId + '&deviceName=' + deviceName + '&connectId=' + obj.connectId
    })

  },

  //蓝牙状态改变监听
  registerBlueAdapterStatusChanage: function () {
    addEventListener('bluetoothStateChange',(res) => {
      that.showBlueoothStatus(isBluetoothAvailable());
    });
  },
});