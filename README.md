# 乐心蓝牙设备小程序插件接入指南
demo地址:https://github.com/liuxinyi/LSBlePluginDemo


## 0、升级管理
 #### 2.0.2(npm1.0.17)
  修改Logger的Array.prototype.insert导致其他插件兼容问题出问题 
  优化在IOS手机下openBluetoothAdapter报错，导致一些状态判断问题
  增加startDataSync时，如果蓝牙状态不可用（系统报错），增加信息读取蓝牙状态逻辑
  修复调用startDataSync，当设备列表为空时，managerStatus状态出错。

## 1、插件使用说明
#### 1.0 插件使用申请

请查看微信小程序插件使用官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/plugin/using.html 当前小程序插件appId: wx43b1ab446b5db1e0 需要申请并等待通过审核后方可使用本插件。

#### 1.1 插件声明

在app.json中声明插件的引用及appId:
```json
{
  "plugins": {
    "LSDevicePlugin": {
    	"version": "{{最新版本}}",
    	"provider": "wx43b1ab446b5db1e0"
    }
  }
}
```

#### 1.2 插件引入

```javascript
const lsPlugin = requirePlugin("LSDevicePlugin")
// 打印插件的版本信息
let version = lsPlugin.getVersion();
```

#### 1.3 插件初始化

建议在app.js的onLaunch方法中初始化插件，避免因系统的差异或系统蓝牙初始化延时，导致的接口功能异常。
如果需要进行设备数据同步，还需要初始化插件鉴权信息(请看1.4)。
```javascript
const lsPlugin = requirePlugin("LSDevicePlugin")

App({
  onLaunch: function () {
    lsPlugin.init(res=>{
              if(res){
                  console.log('蓝牙插件初始化成功')
              }
    })
  }
})
```
#### 1.4 插件鉴权初始化(v2.0.0及以上版本)
发送邮件到以下邮箱申请appId。

发送：
zhihui.xiao@lifesense.com
zheng.lu@lifesense.com

抄送：
zhicheng.liu@lifesense.com
yong.wu@lifesense.com
xinyi.liu@lifesense.com
pengfei.yu@lifesense.com
chengze.wu@lifesense.com

申请成功后，请通过下面代码初始化鉴权信息
```javascript
lsPlugin.initAuthorization({
     //用邮件乐心分配的appId替换掉下面字符串
    appId: 'com.leshiguang.saas.rbac.demo.appid'
  });
```


## 2、接口定义

#### 1.1 getVersion
  获取插件版本信息。

#### 1.2 getManagerStatus
  获取当前插件的工作状态，插件的工作状态主要有以下几种。同一时间，插件只允许出现一种状态。如在扫描时，不能进行数据同步或绑定，需要先调用相应的接口把扫描停止；或在数据同步的时候，不能调用扫描和绑定。

| 枚举 | 值 |  说明  |
| :--- | :---: | :--- |
| Free | 0 | 空闲 |
| Scanning | 1 | 扫描中 |
| Pairing | 2 | 绑定中 |
| Syncing | 3 | 同步 |
| Upgrading | 4 | 升级中 |
| Bustling | 5 | 处理中 |

#### 1.3 init
  插件初始化

#### 1.4 startScanning
  启动蓝牙扫描。
```javascript
//定义扫描结果回调
let scanCallback = function(scanResult){}

//设置扫描过滤条件
let filters = [];
filters.push(lsPlugin.Profiles.ScanFilter.Scale);//秤
filters.push(lsPlugin.Profiles.ScanFilter.ActivityTracker)//手环
filters.push(lsPlugin.Profiles.ScanFilter.All)//全部

//调用扫描接口  
lsPlugin.startScanning(scanCallback, filters);
```

扫描回调信息

| 字段名 | 类型 |  说明  |
| :--- | :---: | :--- |
| deviceName | String | 设备广播名 |
| id | String | 设备标识符 |
| manufactureData | Object | 厂商自定义数据 |
| services | Array | 广播服务 |
| broadcastId | String | 设备广播ID |
| isSystemPaired | Boolean | 是否已在系统的配对列表中 |


#### 1.5 stopScanning
  停止蓝牙扫描。

#### 1.6 ~~addDevice~~
  在v2.0.0及以上版本被废弃不能使用，请使用addMeasureDevice代替

#### 1.6.1 addMeasureDevice (v2.0.0及以上版本)
  添加设备,在调用插件的数据同步接口前，需要先将添加目标设备。支持同时连接多设备。
  
    注意，必须先初始化鉴权信息，方可使用此接口(请看插件鉴权初始化)

#### 1.7 removeDevice
  删除设备。设备删除后，插件会断开其已连接的蓝牙连接，同时将该设备从缓存的设备列表里清空。再次连接需要重新添加设备。
  
#### 1.8 bindDevice
  设备绑定 配对。对于支持随机码绑定的手环及互联秤，可以通过该接口使用用户与手环或秤的绑定业务逻辑，接口使用示例如下。
  
#### 1.9 cancelDeviceBinding
  取消设备绑定。

#### 1.10 startDataSync
  启动数据同步，如果是初次启动，内部会自动调用startConnectDevice接口

#### 1.11 stopDataSync
  停止数据同步。
  
#### 1.12 isStartSyncing
   判断是否启动设备同步。返回true/false。
   如果 getManagerStatus()===3(Syncing)则返回true 
   
#### 1.13 startConnectDevice
   如果已经启动设备同步，可以使用startConnectDevice 触发重新连接未连接的设备
   建议代码如下:
   ```javascript
/**
 * 开启设备同步
 */
export function startDeviceSync() {

  console.log("[Device Manager] start device data sync");
  if (lsPlugin.isStartSyncing()) {
    lsPlugin.startConnectDevice();
  } else {
    lsPlugin.startDataSync(_syncCallback) 
  }
}
````

#### 1.14 getBluetoothState
  获取当前蓝牙状态。

#### 1.15 registerBluetoothStateListener
  注册蓝牙状态变更回调。

#### 1.16 unregisterBluetoothStateListener
  取消蓝牙状态变更回调。

#### 1.17 isBluetoothAvailable
  判断蓝牙是否可用。

#### 1.18 readDeviceBattery
  读取设备电量信息。

#### 1.17 pushSettings
  推送设备设置信息或绑定消息。

#### 1.17 setLogInterface
设置日志接口，回调插件日志。用于定位和解决问题
   ```javascript
import wxLogger from "./log.js"

lsPlugin.setLogInterface(wxLogger);


// log.js内容如下

var log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null
module.exports = {
  debug() {
    if (!log) return
    log.debug.apply(log, arguments)
  },
  info() {
    if (!log) return
    log.info.apply(log, arguments)
  },
  warn() {
    if (!log) return
    log.warn.apply(log, arguments)
  },
  error() {
    if (!log) return
    log.error.apply(log, arguments)
  },
}


```
## 3、设备绑定流程说明

设备绑定流程只适用于支持随机码绑定的手环或手表、或使用A6协议的互联秤。使用设备绑定接口时，需要遵循先扫描、停止扫描（成功匹配目标设备后）、调用绑定接口、重写相应的绑定回调的实现逻辑。

#### 3.1 扫描

扫描结果将通过回调方法返回，扫描结果信息参考1.4。
```javascript
lsPlugin.startScanning(function (scanResutls) {
    console.log("scanResutls", scanResutls)
});
```

#### 3.2 停止扫描

由于系统调用停止扫描接口是异步的，因此建议第三方小程序，在停止扫描后，可以延时1~3s再调用设备绑定接口，防止系统蓝牙出现异常。

#### 3.3 绑定

在设备绑定过程中，App需要重写相应的绑定操作回调接口，并结合相应的操作指令，对设备的请求进行回复，示例代码如下:

###### 3.3.1 注册绑定接口回调
```javascript
let onBindingListener = {
   //连接状态改变回调
  onConnectionStateChanged(deviceMac, state) {
    
  },

  //绑定操作指令更新回调
  onBindingCommandUpdate(deviceMac, bindCmd) {
    if (bindCmd === lsPlugin.Profiles.BindingCmd.InputRandomNumber) {
      //提示 输入随机数
      let randomNum = new lsPlugin.SettingProfile.RandomNumSetting('随机数');
      lsPlugin.pushSettings(deviceMac, randomNum, onSettingListener);
    }
    else if (bindCmd === lsPlugin.Profiles.BindingCmd.RegisterDeviceID) {
      //提示 注册互联秤设备ID
      let id = 'A4C13891556E';
      let idSetting = new lsPlugin.SettingProfile.RegisterIdSetting(id);
      lsPlugin.pushSettings(deviceMac, idSetting, onSettingListener);
    }
  },

  //绑定结果回调
  onBindingResults(deviceInfo, status) {
    if (status) {
      //绑定成功
    }
    else {
      //绑定失败
    }
  }
}
```


#### 3.3.2 设备绑定

在调用设备绑定接口时，需要确保插件的工作状态为Free,若遇到插件的工作状态为Scanning或Syncing，需要先调用stopScanning或stopDataSync接口把插件的工作状态置为空闲，否则设备绑定接口将不可用。
  
```javascript
//获取扫描结果对象
let scanResult = {
  broadcastId: '', //扫描结果返回的设备广播ID
  id: ''          //扫描结果返回的设备标识符ID
};

lsPlugin.bindDevice(scanResult, onBindingListener);
```

## 4、设备数据同步流程说明

* 设备测量数据同步，需要App将目标设备的设备MAC、或设备信息添加到插件中。设备添加成功后，App可以通过startDataSync接口启动测量数据自动同步服务。同步服务启动后，插件自动处理扫描、连接、数据同步等，直至App通过调用接口stopDataSync，将同步服务关闭。
* 调用过startDataSync，在一个连接周期还未连接上设备，或者曾经连接成功过设备，但是因为其他原因导致断开了连接，触发重连请使用startConnectDevice。
* 在数据同步过程中，可以通过接口removeDevice，将设备从插件的缓存列表里删除。设备删除后，连接会断开。若App需要再次连接该设备，需要重新调用设备添加接口，重新把设备添加到插件中，重新开启数据同步服务。
* 对于设备信息的获取，可以通过绑定关系从服务端查询，或直接通过蓝牙搜索，从扫描结果解析相关的设备信息。

#### 4.1 添加设备
  
添加设备所使用的接口参数，主要是从扫描结果中获取

```javascript
//定义设备信息对象
let device = {
  deviceSn: '',  //设备SN，非必须
  model:'',//设备型号，非必须
  deviceMac: '', //设备MAC  必须
  bluetoothConnectId:'' // 通过回调onUpdateBluetoothConnectId获取，微信返回的deviceId,在IOS手机，在设备和手机配对情况下，必传这个值，否则可能连接不上 
};
//2.0.0及以上版本
lsPlugin.addMeasureDevice(device, (res) => {
    if (res.code === 200) {
      console.log("addMeasureDevice succeed",res)
    } else { 
     //添加设备失败，请根据res.msg联系我们
      console.log('addMeasureDevice fail', res);
      wx.showToast({
        title: res.msg, icon: 'none',
      });
    }
  });
```
添加设备失败错误对照

| 状态码(code) | msg |  注释  |
| :--- | :---: | :--- |
| -1 | 本地异常 | 其他异常场景，比如未initAuthorization |
| 20003 | no license for this model | 未购买此型号授权 |
| 20004 | run out of license | 授权已用完 |
| 20005 | INVALID_SERVICE | 无效的服务&版本 |
| 20006 | INVALID_DEVICE | 设备未认证 |
| 20007 | INVALID_APPID | 无效的appid |

   
#### 4.2 注册数据同步回调

```javascript
let _syncCallback = {
  /*连接状态改变

*/
  onConnectionStateChanged(deviceMac, status) {
   //status 状态定义详情请看
  
    if (status === 2) {
      //连接成功
    } else {
      //连接断开
    }

  },

  //设备测量数据回调
  onDataChanged(deviceMac, dataType, data, dataStr) {
    //deviceMac 设备MAC
    //dataType 测量数据类型 数据类型查看第6节
    //data 测量数据对象
    //dataStr 测量数据简述，字符串形式
  },
  //ios connectId(deviceId) 更新
  onUpdateBluetoothConnectId(deviceMac, connectId) {
    console.log('onUpdateBluetoothConnectId:', deviceMac, connectId);  
    //尽量同步到服务端，addMeasureDevice时 赋值给bluetoothConnectId
  },
}
```
连接状态定义onConnectionStateChanged#status

| 枚举 | 值 |  说明  |
| :--- | :---: | :--- |
| Unknown | 0 | 未知 |
| Connecting | 1 | 连接中 |
| Connected | 2 | 微信的连接成功|
| Disconnect | 3 | 断开连接 |
| ConnectSuccess | 4 | 协议的连接成功 |
| Scaning | 5 | 设备搜索中 |


#### 4.3 启动数据同步服务

&ensp;&ensp;&ensp;&ensp;在调用设备测量数据同步接口时，需要确保插件的工作状态为WorkStatus.Free.若插件的工作状态为Scanning或Pairing，需要先调用stopScanning或cancelDeviceBinding接口把SDK的工作状态置为空闲，否则设备测量数据同步接口将不可用。
<br>&ensp;&ensp;&ensp;&ensp;小程序进入后台，微信可能会限制设备的蓝牙连接，会出现连接中断，如果已经调用过startDataSync(_syncCallback)，插件状态已经是Sync,可以在进入前台时调用startConnectDevice，这样可以触发重新连接已断开的设备。
<br>&ensp;&ensp;&ensp;&ensp;目前小程序一个连接周期是30s左右，如果30s未成功连接设备，会触发回调onConnectionStateChanged>Disconnect，如需要重新连接，可以主动调用startConnectDevice再触发一次连接周期
<br>&ensp;&ensp;&ensp;&ensp;startConnectDevice可以重复多次调用，内部有状态去重。
#### 4.4 停止数据同步服务

在页面消失或不需要同步设备测量数据时，可以通过以下接口，将数据同步服务关闭
```javascript
{
  onUnload(){
    lsPlugin.stopDataSync();
  }
}

```

## 5、设备设置功能使用说明

关于设备设置功能接口，如闹钟提醒、久坐提醒、事件提醒、自定义页面、运动模式设置、表盘选择设置等统一通过以下接口实现
```javascript
lsPlugin.pushSettings(deviceMac, params, onSettingListener);
```
| 参数 | 说明  |
| :--- | :--- |
| deviceMac | 设备MAC |
| params | 设置信息对象，必须为lsPlugin.SettingProfile中定义的对象或function |
| onSettingListener | 设置回调 |

onSettingListener需要重写以下两个function
```javascript
let onSettingListener = {
    onSuccess() {}, //设置成功 
    onFailure(msg) {} //设置失败
}
```

#### 5.1 不带标签的 闹钟设置

该接口适用于旧固件产品的闹钟提醒设置，如Mambo HR,Mambo Watch，My Mambo，Mambo2等.
目前，手环支持设置的最大闹钟提醒数量为3个,可同时设置多个.

```javascript
//重复周期定义
let repeat=[
    lsPlugin.Profiles.WeekDay.Monday,
    lsPlugin.Profiles.WeekDay.Tuesday,
    lsPlugin.Profiles.WeekDay.Wednesday,
    lsPlugin.Profiles.WeekDay.Thursday,
    lsPlugin.Profiles.WeekDay.Friday,
    lsPlugin.Profiles.WeekDay.Saturday,
    lsPlugin.Profiles.WeekDay.Sunday
];

//振动方式定义
let vibrationMode = lsPlugin.Profiles.VibrationMode.Intermittent1;

//闹钟12:45
let clock = new lsPlugin.SettingProfile.AlarmClock();
clock.status = true;                  //true:打开,false:关闭
clock.time = '12:45';                 //闹钟提醒时间
clock.repeat = repeat;                //闹钟提醒重复周期
clock.vibrationMode = vibrationMode;  //振动方式
clock.vibrationTime = 12;             //振动时间，单位秒
clock.vibrationStrength1 = 3;         //振动强度1，0~9
clock.vibrationStrength2 = 5;         //振动强度2，0~9

//闹钟设置
let clockSetting = new lsPlugin.SettingProfile.AlarmClockSetting([clock], true);

//调用接口
lsPlugin.pushSettings(deviceMac, clockSetting, onSettingListener);
```

#### 5.2 带标签的 闹钟设置（事件提醒）

该接口适用于新固件产品的事件提醒设置，如Mambo2S,Mambo3,Mambo5,Mambo5S等.
目前，手环支持设置的最大事件提醒数量为5个,只支持单个添加.
```javascript
//事件定义
let eventClock = new lsPlugin.SettingProfile.EventClockSetting();
eventClock.label = 'Applet';  //闹钟标签
eventClock.status = true;     //提醒开关，true:打开，false:关闭
eventClock.clockIndex = 0x02; //事件索引，1~5
eventClock.time = '09:36';    //提醒时间
eventClock.repeat = repeat;    //重复周期
eventClock.vibrationMode = vibrationMode;//振动方式
eventClock.vibrationTime = 12;  //振动时间，单位秒
eventClock.vibrationStrength1 = 3; //振动强度1,1~9
eventClock.vibrationStrength2 = 5;//振动强度2,1~9

//调用接口
lsPlugin.pushSettings(deviceMac, eventClock, onSettingListener);
```

#### 5.3 久坐提醒设置

目前，手环支持设置的最大久坐提醒数量为3个,只支持单个添加

```javascript
let sedentary = new lsPlugin.SettingProfile.SedentaryRemind();
sedentary.startTime = '15:57';    //久坐提醒开始时间
sedentary.endTime = '17:56';      //久坐提醒结束时间
sedentary.status = true;          //久坐提醒开关，true:打开，false:关闭
sedentary.sedentaryTime = 2;      //久坐时间，单位 分钟
sedentary.repeat = repeat;        //重复周期
sedentary.vibrationMode = vibrationMode;//振动方式
sedentary.vibrationTime = 12;//振动时间，单位秒
sedentary.vibrationStrength1 = 3;//振动强度1,1~9
sedentary.vibrationStrength2 = 5;//振动强度2,1~9
  
let remindObj = new lsPlugin.SettingProfile.SedentarySetting([sedentary], true);

//调用接口
lsPlugin.pushSettings(deviceMac, remindObj, onSettingListener);
```

#### 5.4 夜间模式设置

该接口只支持以下型号的夜间显示模式设置，如Mambo、Mambo HR、Mambo Watch、Mambo 2、Mambo 3

```javascript
let nightMode = new lsPlugin.SettingProfile.NightModeSetting();
nightMode.status = true;          //夜间模式状态，true:打开,false:关闭
nightMode.startTime = '12:04';    //夜间模式开始时间
nightMode.endTime = '13:08';      //夜间模式结束时间

//调用接口
lsPlugin.pushSettings(deviceMac, nightMode, onSettingListener);
```

#### 5.5 时间格式显示设置

```javascript
let timeFormat;
//12小时
timeFormat= new lsPlugin.SettingProfile.TimeFormatSetting(lsPlugin.Profiles.TimeFormat.Hour12h);

//24小时
timeFormat = new lsPlugin.SettingProfile.TimeFormatSetting(lsPlugin.Profiles.TimeFormat.Hour24h);
   
//调用接口
lsPlugin.pushSettings(deviceMac, timeFormat, onSettingListener);
```

#### 5.6 距离显示单位切换设置
```javascript
let format;
//Km,公制
format = new lsPlugin.SettingProfile.DistanceFormatSetting(lsPlugin.Profiles.DistanceFormat.Km);
  
//Mile,英制
format = new lsPlugin.SettingProfile.DistanceFormatSetting(lsPlugin.Profiles.DistanceFormat.Mile);

//调用接口
lsPlugin.pushSettings(deviceMac, format, onSettingListener);
```

#### 5.7 左、右手佩戴方式切换设置 
  
```javascript
let wearingStyle;
//左手
wearingStyle= new lsPlugin.SettingProfile.StyleOfWearingSetting(lsPlugin.Profiles.WearingStyle.Left);

//右手
wearingStyle= new lsPlugin.SettingProfile.StyleOfWearingSetting(lsPlugin.Profiles.WearingStyle.Right);

//调用接口
lsPlugin.pushSettings(deviceMac, wearingStyle, onSettingListener);
```

#### 5.8 横屏，竖屏切换设置
  
```javascript
let screenStyle;
//横屏
screenStyle= new lsPlugin.SettingProfile.StyleOfScreenSetting(lsPlugin.Profiles.ScreenStyle.Horizontal);

//竖屏
screenStyle= new lsPlugin.SettingProfile.StyleOfScreenSetting(lsPlugin.Profiles.ScreenStyle.Vertical);

//push to device
lsPlugin.pushSettings(deviceMac, screenStyle, onSettingListener);
```
#### 5.9 表盘样式设置

```javascript

//表盘样式定义
export const DialPeaceStyle = Object.freeze({
    DialPeace1: 0x01,   //表盘1
    DialPeace2: 0x02,   //表盘2
    DialPeace3: 0x03,   //表盘3
    DialPeace4: 0x04,   //表盘4
    DialPeace5: 0x05,   //表盘5
    DialPeace6: 0x06,   //表盘6
    DialPeace7: 0x07,   //表盘7
    DialPeace8: 0x08,   //表盘8
    DialPeace9: 0x09,   //表盘9
    DialPeace10: 0x0A,  //表盘10
    DialPeace11: 0x0B,  //表盘11
    DialPeace12: 0x0C,  //表盘12
})

//表盘样式3
let dialpeace = new lsPlugin.SettingProfile.StyleOfDialPeaceSetting(lsPlugin.Profiles.DialPeaceStyle.DialPeace3);

//push to device
lsPlugin.pushSettings(deviceMac, dialpeace, onSettingListener);
```

#### 5.10 运动心率区间提醒设置
  
运动心率区间提醒设置，只在运动模式下生效，普通的心率测量模式无效
```javascript
let exerciseHR = new lsPlugin.SettingProfile.ExerciseHeartRateSetting();
exerciseHR.status = true;
exerciseHR.maxHeartRate = 130;  //运动心率上限
exerciseHR.minHeartRate = 70;   //运动心率下限

//push to device
lsPlugin.pushSettings(deviceMac, exerciseHR, onSettingListener);
```

#### 5.11 心率检测方式设置
```javascript
//关闭心率检测
let disableHR = new lsPlugin.SettingProfile.HeartRateDetectSetting(false);
  
//打开心率检测
let enabelHR = new lsPlugin.SettingProfile.HeartRateDetectSetting(true);
 
//push to device
lsPlugin.pushSettings(deviceMac, enabelHR, onSettingListener);
```

#### 5.12 自定义页面设置
```javascript
 //手环页面定义
export const DevicePage = Object.freeze({
  Time: 0x00,              //时间
  Step: 0x01,              //步数
  Calories: 0x02,          //卡路里
  Distance: 0x03,          //距离
  HeartRate: 0x04,         //心率
  Running: 0x05,           //跑步
  Walking: 0x06,           //健走
  Cycling: 0x07,           //骑行
  Swimming: 0x08,          //游泳
  BodyBuilding: 0x09,      //健身/力量训练
  Climbing: 0x0A,          //登山
  DailyData: 0x0B,         //日常数据
  Stopwatch: 0x0C,         //秒表
  Weather: 0x0D,           //天气
  Battery: 0x0E,            //电量
  IndoorRunning: 0x0F,     //跑步机运动
  Elliptical: 0x10,        //椭圆机
  AerobicSport: 0x11,      //有氧运动
  Basketball: 0x12,        //篮球
  Football: 0x13,          //足球
  Badminton: 0x14,         //羽毛球
  Volleyball: 0x15,        //排球
  PingPong: 0x16,          //乒乓球
  Yoga: 0x17,              //瑜伽
  Gaming: 0x18,            //电竞
  AerobicExercise12: 0x19, //有氧能力运动-12分钟跑
  AerobicExercise6: 0x1A,  //有氧能力运动-6分钟走
  Alipay: 0x1B,            //支付宝页面
  FitnessDance: 0x1C,      //健身舞
  TaiChi: 0x1D,            //太极
})

//自定义页面选择
let pages = [
  lsPlugin.Profiles.DevicePage.Step,
  lsPlugin.Profiles.DevicePage.Stopwatch,
  lsPlugin.Profiles.DevicePage.Step,
  lsPlugin.Profiles.DevicePage.DailyData,
  lsPlugin.Profiles.DevicePage.HeartRate,
  lsPlugin.Profiles.DevicePage.Cycling,
];

//自定义页面设置
let pageSetting = new lsPlugin.SettingProfile.CustomPagesSetting(pages);
  
//push to device
lsPlugin.pushSettings(deviceMac, pageSetting, onSettingListener);
```

## 6、设备测量数据定格式定义
  


#### 6.1 手环日常步行数据 dataType=（0x51 0x57）
```javascript
var _stepData = {
  version: 0,
  cmd: 0,           //命令字
  step: 0,          //步数
  utc: 0,           //UTC
  examount: 0,      //运动量，
  calories: 0,      //卡路里
  exerciseTime: 0,  //运动时间，
  distance: 0,      //距离
  status:0,         //状态
  batteryVoltage:0  //电量电压等级
}
```

#### 6.2 普通心率数据 dataType=（0x53）
```javascript
var _heartRateData = {
  version: 0,
  cmd: 0,         //命令字
  utc: 0,         //UTC
  offset: 0,      //UTC偏移量
  remainCount: 0, //剩余记录数
  dataSize: 0,    //当前上传的记录数
  heartRate: [],  //心率数据集合，每5分钟一个点，集合中每个值之间的itemUtc=utc+index*offset
}
```

#### 6.3 睡眠数据 dataType=(0x52)
```javascript
var _sleepData = {
  version: 0,
  cmd: 0,         //命令字
  utc: 0,         //UTC
  offset: 0,      //UTC偏移量
  remainCount: 0, //剩余数据记录
  dataSize: 0,    //当前上传的数据记录
  sleepStatus: [],//睡眠数据集合，每5分钟一个点，集合中每个值之间的itemUtc=utc+index*offset
  unpacked: false,
}
```

#### 6.4 运动类别

```javascript
export const ExerciseCategory = Object.freeze({
  Running: 0x01,               //运动模式 - 跑步
  Walking: 0x02,               //运动模式 - 健走
  Cycling: 0x03,               //运动模式 - 骑行
  Swimming: 0x04,              //运动模式 - 游泳
  BodyBuilding: 0x05,          //运动模式 - 健身/力量训练
  NewRunning: 0x06,            //运动模式 - 新跑步模式
  IndoorRunning: 0x07,         //运动模式 - 跑步机运动
  Elliptical: 0x08,            //运动模式 - 椭圆机运动
  AerobicSport: 0x09,          //运动模式 - 有氧运动
  Basketball: 0x0A,            //运动模式 - 篮球运动
  Football: 0x0B,              //运动模式 - 足球运动
  Badminton: 0x0C,             //运动模式 - 羽毛球运动
  Volleyball: 0x0D,            //运动模式 - 排球运动
  Pingpong: 0x0E,              //运动模式 - 乒乓球运动
  Yoga: 0x0F,                  //运动模式 - 瑜伽运动
  Gaming: 0x10,                //运动模式 - 电竞运动
  AerobicSport12: 0x11,        //运动模式 -有氧运动 12分钟跑
  AerobicSport6: 0x12,         //运动模式 -有氧运动 6分钟走
  FitnessDance: 0x13,          //运动模式 - 健身舞
  TaiChi: 0x14,                //运动模式 - 太极
})
```

#### 6.5 运动总结数据 dataType=（0xE2）

```javascript
var _exerciseData ={
  version:0,               //版本
  cmd:0,                   //命令字
  category:1,               //运动类别
  mode: 0,                  //运动模式 0x00:手动进入 0x01:自动识别 0x02:轨迹跑有通知到 APP 0x03:轨迹跑没有通知到 APP
  flag:0,                   //标志位       
  pausesCount: 0,           //暂停次数
  startUtc: 0,             //开始时间
  stopUtc: 0,              //结束时间
  time: 0,                 //运动时长,单位秒
  step: 0,                 //运动过程中产生的总步数
  calories: 0,             //运动过程中消耗的总卡路里，单位: 0.1Kcal
  maxHeartRate: 0,         //最大心率
  avgHeartRate: 0,         //平均心率
  maxSpeed: 0,             //最大速度 单位 0.01Km/h
  avgSpeed: 0,             //平均速度 单位 0.01Km/h
  distance: 0,             //距离 单位:米
  maxStepFrequency: 0,     //最大步频
  avgStepFrequency: 0,     //平均步频
  status: [],              //运动过程状态列表
  numOfSwimming:null,      //游泳圈数
  unpackedData: '',
  unpackedStatus: false,
}
```

#### 6.6 运动心率数据 dataType=（0xE5 0x73）

```javascript
var _heartRateData = {
  version: 0,
  cmd: 0,         //命令字
  category: 1,    //运动类别
  mode: 0,        //运动模式，手动或自动识别
  utc: 0,         //开始时间UTC
  offset: 0,      //UTC偏移量
  remainCount: 0, //剩余数据记录
  dataSize: 0,    //当前上传数据记录条数
  heartRate: [],  //运动心率数据集合，每1分钟一个点，对应每个点的itemUtc=utc+index*offset
}
```

#### 6.7 运动卡路里数据 dataType=（0xE6 0x7F）

```javascript
var _caloriesData = {
  version: 0,
  cmd: 0,         //命令字
  category:1,     //运动类别
  mode:0,         //运动模式，手动或自动识别
  utc: 0,         //开始时间UTC
  offset: 0,      //utc偏移量
  remainCount: 0, //剩余数据记录条数
  dataSize: 0,    //当前上传数据记录条数
  calories: [],   //运动卡路里数据集合，每1分钟一个点，对应每个点的itemUtc=utc+index*offset
}
```

#### 6.8 运动配速数据 dataType=（0xE4）

```javascript
var _exerciseSpeed = {
  version: 0,
  cmd: 0,         //命令字
  category: 1,    //运动类别 
  mode: 0,        //运动模式，手动或自动识别
  utc: 0,         //开始时间UTC
  offset: 0,      //UTC偏移量
  remainCount: 0, //剩余数据记录条数
  dataSize: 0,    //当前上传数据记录条数
  speeds: [],     //运动配速数据集合，对应每个点的itemUtc=utc+index*offset
}
```

#### 6.9 体重测量数据  dataType=（0x4802）

```javascript
var _weightData = {
  cmd:null,               //命令字
  remainCount:0,          //剩余测量数据条数
  flag:0x00,              //标志位
  uint:'',                //单位,0=kg,1=lb,2=st,3=斤
  weight:0,               //体重
  utc:0,                  //utc
  resistance:0,           //电阻值
  userNumber:null,        //用户编号
  timeZone:null,          //时区
  timeStamp:null,          //测量时间戳
  realtimeDataStatus:false,//实时测量数据状态
}
```