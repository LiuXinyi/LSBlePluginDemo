
var LSBluetoothPlugin = requirePlugin("LSDevicePlugin")
var ByteUtils = require('../ByteUtils.js')

var onSettingListener = null;//new OnSettingListener();
var onBindingListener = null;//new OnBindingListener();
var onReadingLisener = null;//new OnReadingListener();

const SETTING_ITEM_DEVICE_BINDING = 'Device Binding';
const SETTING_ITEM_ALARM_CLOCK = 'Alarm Clock';
const SETTING_ITEM_EVENT_CLOCK = 'Event Clock';
const SETTING_ITEM_SEDENTARY = 'Sedentary Remind';
const SETTING_ITEM_TIME_FORMAT = 'Time Format';
const SETTING_ITEM_DISTANCE_FORMAT = 'Distance Format';
const SETTING_ITEM_WEARING_MODE = 'Wearing Mode';
const SETTING_ITEM_SCREEN_MODE = 'Screen Mode';
const SETTING_ITEM_NIGHT_MODE = 'Night Mode';
const SETTING_ITEM_HR_DETECT = 'Heart Rate Detect';
const SETTING_ITEM_EXERCISE_HR = 'Exercise Heart Rate';
const SETTING_ITEM_CUSTOM_PAGES = 'Custom Pages';
const SETTING_ITEM_DIALPEACE_MODE = 'Dialpeace Select';
const SETTING_ITEM_READ_BATTERY = 'Device Battery'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    repeat: [
      LSBluetoothPlugin.Profiles.WeekDay.Monday,
      LSBluetoothPlugin.Profiles.WeekDay.Tuesday,
      LSBluetoothPlugin.Profiles.WeekDay.Wednesday,
      LSBluetoothPlugin.Profiles.WeekDay.Thursday,
      LSBluetoothPlugin.Profiles.WeekDay.Friday,
      LSBluetoothPlugin.Profiles.WeekDay.Saturday,
      LSBluetoothPlugin.Profiles.WeekDay.Sunday
    ],
    settings: [
      SETTING_ITEM_DEVICE_BINDING,
      SETTING_ITEM_READ_BATTERY,
      SETTING_ITEM_ALARM_CLOCK,
      SETTING_ITEM_EVENT_CLOCK,
      SETTING_ITEM_SEDENTARY,
      SETTING_ITEM_TIME_FORMAT,
      SETTING_ITEM_DISTANCE_FORMAT,
      SETTING_ITEM_WEARING_MODE,
      SETTING_ITEM_SCREEN_MODE,
      SETTING_ITEM_NIGHT_MODE,
      SETTING_ITEM_HR_DETECT,
      SETTING_ITEM_CUSTOM_PAGES,
      SETTING_ITEM_DIALPEACE_MODE,
      SETTING_ITEM_EXERCISE_HR,
    ],
    showRandomNumInput: true,
    deviceMac: '',
    deviceName: '',
    randomNumber: '',
    isDeviceBinding: false,
    connectId:''
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
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    let self = this;
    /**
     * 注册设置回调
     */
    onSettingListener = {
      onSuccess: function () {
        console.log('UI OnSettingListener.success');
        if (!self.data.isDeviceBinding) {
          self.showSuccess('设置成功');
        }
      },
      onFailure: function (msg) {
        console.log('UI OnSettingListener.failure', msg);
        self.showFailure();
      }
    }

    /**
     * 注册读取回调
     */
    onReadingLisener = {
      onBatteryInfo: function (deviceMac, state, info) {
        wx.hideLoading();
        if (state) {
          console.log('UI.onBatteryInfo >> ', state, info);
          //绑定成功
          self.showSuccess('获取电量成功');
          self.setData({
            isDeviceBinding: false,
          })
        }
        else {
          //绑定失败
          self.showFailure('获取电量成功,请重试!');
          self.setData({
            isDeviceBinding: false,
          })
        }
      }
    }

    /**
     * 注册绑定回调
     */
    onBindingListener = {
      onConnectionStateChanged: function (deviceMac, state) {

      },
      onBindingCommandUpdate: function (deviceMac, bindCmd) {
        if (bindCmd === LSBluetoothPlugin.Profiles.BindingCmd.InputRandomNumber) {
          wx.hideLoading();
          //输入随机数
          self.setData({
            showRandomNumInput: false
          })
        }
        else if (bindCmd === LSBluetoothPlugin.Profiles.BindingCmd.RegisterDeviceID) {
          //注册设备ID
          let id = deviceMac;//mac.replace(/:/g, '')
          let idSetting = new LSBluetoothPlugin.SettingProfile.RegisterIdSetting(id);
          LSBluetoothPlugin.pushSettings(deviceMac, idSetting, onSettingListener);
        }
      },
      onBindingResults: function (deviceInfo, status) {
        if (status) {
          console.log('UI.onBindingResults >> ', deviceInfo);
          //绑定成功
          self.showSuccess('绑定成功');
          self.setData({
            isDeviceBinding: false,
          })
        }
        else {
          //绑定失败
          self.showFailure('绑定失败,请重试!');
          self.setData({
            isDeviceBinding: false,
          })
        }
      }
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  selectSetting: function (e) {
    let item = e.currentTarget.dataset.text;
    console.log("select setting", JSON.stringify(item), item, (item == 'Alarm Clock'));
    if (item === SETTING_ITEM_ALARM_CLOCK) {
      this.testAlarmClock();
    }
    else if (item === SETTING_ITEM_EVENT_CLOCK) {
      this.testEventClock();
    }
    else if (item === SETTING_ITEM_SEDENTARY) {
      this.testSedentaryRemind();
    }
    else if (item === SETTING_ITEM_TIME_FORMAT) {
      this.testTimeFormat();
    }
    else if (item === SETTING_ITEM_DISTANCE_FORMAT) {
      this.testDistanceFormat();
    }
    else if (item === SETTING_ITEM_WEARING_MODE) {
      this.testWearingStyle();
    }
    else if (item === SETTING_ITEM_SCREEN_MODE) {
      this.testScreenStyle();
    }
    else if (item === SETTING_ITEM_NIGHT_MODE) {
      this.testNightStyle();
    }
    else if (item === SETTING_ITEM_HR_DETECT) {
      this.testHeartRateDetect();
    }
    else if (item === SETTING_ITEM_CUSTOM_PAGES) {
      this.testCustomPages();
    }
    else if (item === SETTING_ITEM_DIALPEACE_MODE) {
      this.testDialpeaceSetting();
    }
    else if (item === SETTING_ITEM_EXERCISE_HR) {
      this.testExerciseHeartRate();
    }
    else if (item === SETTING_ITEM_DEVICE_BINDING) {
      this.setData({
        randomNumber: '',
        isDeviceBinding: true,
      })
      this.testDeviceBinding();
    }
    else if (item === SETTING_ITEM_READ_BATTERY) {
      wx.showLoading({
        title: 'reading...',
        icon: 'loading',
      })
      LSBluetoothPlugin.readDeviceBattery(this.data.deviceMac, onReadingLisener);
    }
  },

  showBusy: function () {
    wx.hideLoading();
    wx.showToast({
      title: 'syncing...',
      mask: true,
      icon: 'loading'
    })
  },

  //设置成功提示
  showSuccess: function (titleMsg) {
    wx.hideLoading();
    wx.showToast({
      title: titleMsg,
      mask: true,
      icon: 'success'
    })
  },

  //设置失败提示
  showFailure: function () {
    wx.hideLoading();
    wx.showToast({
      title: '设置失败',
      mask: false,
      icon: 'none'
    })
  },

  //ActionSheet Menu
  showMenu: function () {
    wx.showActionSheet({
      itemList: ['列1', '列2', '列3'],//显示的列表项
      success: function (res) {//res.tapIndex点击的列表项
        console.log("点击了列表项：" + res.tapIndex)
      },
      fail: function (res) { },
      complete: function (res) { }
    })
  },

  /**
   * 随机数输入确认
   */
  confirm(e) {
    console.log('confirm of random number input', this.data.randomNumber);
    this.setData({
      showRandomNumInput: true
    })
    wx.showLoading({
      title: 'binding...',
      icon: 'loading',
    })
    //输入随机数
    let randomNumSetting = new LSBluetoothPlugin.SettingProfile.RandomNumSetting(this.data.randomNumber);
    LSBluetoothPlugin.pushSettings(this.data.deviceMac, randomNumSetting, onSettingListener);
  },

  /**
   * 更新用户输入的随机数
   */
  inputRandomNum(evt) {
    this.setData({
      randomNumber: evt.detail.value
    })
  },


  /**
   * ****************************
   */
  pushSetting(obj) {
    console.log('push setting to device', this.data.deviceMac);
    wx.showLoading({
      title: 'syncing...',
      icon: 'loading',
    })
    //调用接口
    LSBluetoothPlugin.pushSettings(this.data.deviceMac, obj, onSettingListener);
  },

  /**
   * 测试设备绑定
   */
  testDeviceBinding() {
    //断开数据同步连接
    LSBluetoothPlugin.stopDataSync();
    wx.showLoading({
      title: 'binding...',
      icon: 'loading',
    })
    //建立绑定连接
    let obj = {
      broadcastId: this.data.deviceMac,
      id: this.data.connectId
    }
    //建立绑定连接
    LSBluetoothPlugin.bindDevice(obj, onBindingListener);
  },

  /**
   * 闹钟测试
   */
  testAlarmClock() {
    let clock = new LSBluetoothPlugin.SettingProfile.AlarmClock();
    clock.status = true;
    clock.time = '12:45';
    clock.repeat = this.data.repeat;
    clock.vibrationMode = LSBluetoothPlugin.Profiles.VibrationMode.Intermittent1;
    clock.vibrationTime = 12;
    clock.vibrationStrength1 = 3;
    clock.vibrationStrength2 = 5;
    let clockSetting = new LSBluetoothPlugin.SettingProfile.AlarmClockSetting([clock], true);
    console.log('clock cmd test', clockSetting.cmd(), ByteUtils.ab2hex(clock.getBytes()));
    //设置
    this.pushSetting(clockSetting);
  },

  /**
   * 事件提醒
   */
  testEventClock() {
    let eventClock = new LSBluetoothPlugin.SettingProfile.EventClockSetting();
    eventClock.label = 'Applet';
    eventClock.status = true;
    eventClock.clockIndex = 0x02;
    eventClock.time = '09:36';
    eventClock.repeat = this.data.repeat;
    eventClock.vibrationMode = LSBluetoothPlugin.Profiles.VibrationMode.Intermittent1;
    eventClock.vibrationTime = 12;
    eventClock.vibrationStrength1 = 3;
    eventClock.vibrationStrength2 = 5;
    console.log('event clock >> ', ByteUtils.ab2hex(eventClock.getBytes()));
    //设置
    this.pushSetting(eventClock);
  },

  //测试久坐提醒
  testSedentaryRemind() {
    let sedentary = new LSBluetoothPlugin.SettingProfile.SedentaryRemind();
    sedentary.startTime = '15:57';
    sedentary.endTime = '17:56';
    sedentary.status = true;
    sedentary.sedentaryTime = 2;
    sedentary.repeat = this.data.repeat;
    sedentary.vibrationMode = LSBluetoothPlugin.Profiles.VibrationMode.Intermittent1;
    sedentary.vibrationTime = 12;
    sedentary.vibrationStrength1 = 3;
    sedentary.vibrationStrength2 = 5;
    let remindObj = new LSBluetoothPlugin.SettingProfile.SedentarySetting([sedentary], true);
    console.log('sedentary remind >> ', ByteUtils.ab2hex(sedentary.getBytes()));
    this.pushSetting(remindObj);
  },

  //夜间模式设置
  testNightStyle() {
    let nightMode = new LSBluetoothPlugin.SettingProfile.NightModeSetting();
    nightMode.status = true;
    nightMode.startTime = '12:04';
    nightMode.endTime = '13:08';
    //push to device
    this.pushSetting(nightMode);
  },

  //12h、24h切换设置
  testTimeFormat() {
    let timeFormat = new LSBluetoothPlugin.SettingProfile.TimeFormatSetting(LSBluetoothPlugin.Profiles.TimeFormat.Hour12h);
    //push to device
    this.pushSetting(timeFormat);
  },

  //距离显示单位切换设置
  testDistanceFormat() {
    let distanceFormat = new LSBluetoothPlugin.SettingProfile.DistanceFormatSetting(LSBluetoothPlugin.Profiles.DistanceFormat.Km);
    //push to device
    this.pushSetting(distanceFormat);
  },

  //左、右手佩戴方式切换设置 
  testWearingStyle() {
    let wearingStyle = new LSBluetoothPlugin.SettingProfile.StyleOfWearingSetting(LSBluetoothPlugin.Profiles.WearingStyle.Left);
    //push to device
    this.pushSetting(wearingStyle);
  },

  //横屏，竖屏切换设置
  testScreenStyle() {
    let screenStyle = new LSBluetoothPlugin.SettingProfile.StyleOfScreenSetting(LSBluetoothPlugin.Profiles.ScreenStyle.Horizontal);
    //push to device
    this.pushSetting(screenStyle);
  },

  //表盘样式设置
  testDialpeaceSetting() {
    let dialpeace = new LSBluetoothPlugin.SettingProfile.StyleOfDialPeaceSetting(LSBluetoothPlugin.Profiles.DialPeaceStyle.DialPeace3);
    //push to device
    this.pushSetting(dialpeace);
  },


  //运动心率区间提醒设置
  testExerciseHeartRate() {
    let exerciseHR = new LSBluetoothPlugin.SettingProfile.ExerciseHeartRateSetting();
    exerciseHR.status = true;
    exerciseHR.maxHeartRate = 130;  //运动心率上限
    exerciseHR.minHeartRate = 70;   //运动心率下限
    //push to device
    this.pushSetting(exerciseHR);
  },

  //心率检测方式设置
  testHeartRateDetect() {
    //disable heart rate detection
    let disableHR = new LSBluetoothPlugin.SettingProfile.HeartRateDetectSetting(false);
    //enable heart rate detection
    let enabelHR = new LSBluetoothPlugin.SettingProfile.HeartRateDetectSetting(true);
    //push to device
    this.pushSetting(disableHR);
  },

  //自定义页面设置
  testCustomPages() {
    let pages = [
      LSBluetoothPlugin.Profiles.DevicePage.Step,
      LSBluetoothPlugin.Profiles.DevicePage.Stopwatch,
      LSBluetoothPlugin.Profiles.DevicePage.Step,
      LSBluetoothPlugin.Profiles.DevicePage.DailyData,
      LSBluetoothPlugin.Profiles.DevicePage.HeartRate,
      LSBluetoothPlugin.Profiles.DevicePage.Cycling,
    ];
    let pageSetting = new LSBluetoothPlugin.SettingProfile.CustomPagesSetting(pages);
    //push to device
    this.pushSetting(pageSetting);
  },
})