/**
 * 引入插件
 */
var LSBluetoothPlugin = requirePlugin("LSDevicePlugin")

let deviceMap = {}; // 用户设备列表
let _connectionStateListener = []; // 连接状态变更回调
let _bluetoothStateListener = []; // 蓝牙状态变更回调
let _dataRevListener=[];//数据回调

let _bluetoothRebootRestartSyncListener = function (res) {
  //蓝牙可用
  if (isBluetoothAvailable()) {
    //当前工作状态是数据同步(调用过startSync)，防止干扰设备绑定流程,或者没准备好设备同步。
    if (LSBluetoothPlugin.getManagerStatus() === LSBluetoothPlugin.Profiles.WorkStatus.Syncing) {
      console.log('蓝牙重启，自动重连')
      startDeviceSync();
    }
  }
};
/**
 * 蓝牙是否可用
 * @returns {boolean}
 */
export function isBluetoothAvailable(){
  return LSBluetoothPlugin.isBluetoothAvailable();
}

/**
 *
 * @param eventName: bluetoothStateChange | connectionStateChange
 * @param listener
 */
export function addEventListener(eventName, listener) {
  if (eventName === 'bluetoothStateChange') {
    _bluetoothStateListener.push(listener)
  } else if (eventName === 'connectionStateChange') {
    _connectionStateListener.push(listener)
  } else if(eventName==='dataChanged'){
      _dataRevListener.push(listener);
  } else{
    console.error("[Device Manager] Invalid eventName: " + eventName)
  }
}

let _syncCallback = {
  onConnectionStateChanged: function (deviceMac, status, type) {
    console.log(`[Device Manager] Connection state change: Mac = ${deviceMac} Status = ${status}`);

    // console.log(getDevices());
    setTimeout(() => {
      //回调给外部增加一个timeout
      _connectionStateListener.forEach(listener => listener && listener(deviceMap[deviceMac.toUpperCase()]))
    }, 0);
      if (deviceMap[deviceMac.toUpperCase()]) {
          deviceMap[deviceMac.toUpperCase()].status = status; // BGattProfiles.DConnectState
      }
  },

  onDataChanged: function (deviceMac, dataType, data, dataStr) {
    console.log(deviceMac, dataType, data, dataStr);

      setTimeout(() => {
          //回调给外部增加一个timeout
          _dataRevListener.forEach(listener => listener && listener(deviceMac, dataType, data, dataStr))
      }, 0);
      if (dataType === 0) {
          deviceMap[deviceMac.toUpperCase()].softwareVesion = data.softwareVesion;
      }
    // 上传数据
    // upload(deviceMap[deviceMac.toUpperCase()], dataType, data);
  },
  onUpdateBluetoothConnectId: function(deviceMac, connectId) {
    wx.setStorageSync('ConnectId' + deviceMac, connectId);
  },
  
};
/**
 * 初始化设备管理
 */
export function initManager(callback) {
  console.log('初始化插件，版本>', LSBluetoothPlugin.getVersion());

  LSBluetoothPlugin.init(callback);
  LSBluetoothPlugin.setLogInterface(wx.getLogManager());
  //初始化授权信息
  LSBluetoothPlugin.initAuthorization({
    appId: 'com.leshiguang.saas.rbac.demo.appid',//乐心分配给平台的appId
  });
  if (_bluetoothStateListener.indexOf(_bluetoothRebootRestartSyncListener) === -1) {
    _bluetoothStateListener.push(_bluetoothRebootRestartSyncListener)
  }
    LSBluetoothPlugin.registerBluetoothStateListener([], (res) => {
        _bluetoothStateListener.forEach(listener => listener &&  listener(res))
    });
  
}

/**
 * scanOption = {
 *  broadcastNames: "LS Band 5s", // 蓝牙广播名
 *  callback: function(scanResult) //设备回调
 * }
 */
export function scanDevice(scanOption) {
    console.log("LSBluetoothPlugin",LSBluetoothPlugin)
  LSBluetoothPlugin.stopDataSync('scan to bind device');
  LSBluetoothPlugin.stopScanning(() => {});

  let bns = scanOption.broadcastNames;
  let cb = scanOption.callback;

  let scanCallback = function (res) {
    if (!res || !res.deviceName ) return;

    if (bns) {
      if (bns.indexOf(res.deviceName) > -1) {
        cb(res) // 根据广播名称过滤
      }
    } else {
      cb(res) // 不过滤
    }
  };
  return  LSBluetoothPlugin.startScanning(scanCallback, [LSBluetoothPlugin.Profiles.ScanFilter.All]);
}

/**
 * 绑定设备，校验和读取设备信息
 * @param scanResult 搜索到的设备对象
 * @param callback
 */
export function bindDevice(scanResult, callback) {
  LSBluetoothPlugin.stopScanning(() => {});
  LSBluetoothPlugin.stopDataSync('bind device');

  let onBindingListener = {
    //连接状态改变回调
    onConnectionStateChanged(deviceMac, state, type) {

    },
    //绑定操作指令更新回调
    onBindingCommandUpdate(deviceMac, bindCmd, deviceInfo) {
      if (bindCmd === LSBluetoothPlugin.Profiles.BindingCmd.InputRandomNumber) {
        //需要让用户输入手环上的随机码，然后调用接口#pushSettingsRandomNum,
        //如果随机码校验成功，则会回调onBindingResults
        //注意，需要监控pushSettingsRandomNum接口callback,如果失败，则需要让用户重新输入随机码
        callback.onBindingCommandUpdate({deviceMac, code: 1, deviceInfo}) // 1是随机码

      } else if (bindCmd === LSBluetoothPlugin.Profiles.BindingCmd.RegisterDeviceID) {
        //deviceInfo
        deviceInfo.mac = deviceMac;
        callback.onBindingCommandUpdate({deviceMac, code: 2, deviceInfo})
        //这个状态表明秤还未初始化，需要使用deviceInfo去服务端注册该设备，并分配deviceId
        //然后把分配到的deviceId，调用pushSettingsRegisterId写入秤体，完成初始化。
        //如果秤已经初始化了(上次写过deviceId)，则直接回调 onBindingResults 绑定成功。
        //如果需要重置设备还原初始化状态，长按秤体reset键。
      }
    },
    //绑定结果回调
    onBindingResults(deviceInfo, status) {
      if (status) { // 绑定成功
        //绑定成功会返回deviceInfo，需要把deviceInfo.deviceId和用户在服务端建立绑定关系。
        callback.onBindingResults({deviceInfo, code: 200})
      } else {  // 绑定失败
        callback.onBindingResults({deviceInfo, code: 500})
      }
    }
  };

  console.log("开始绑定设备:", scanResult);
  LSBluetoothPlugin.bindDevice(scanResult, onBindingListener);
}

/**
 * 结束扫描
 */
export function stopScan() {
  console.log('[Device Manager] stop scan');
  LSBluetoothPlugin.stopScanning(() => {})
}

/**
 * 取消绑定
 * @param scanResult
 */
export function cancelDeviceBinding(scanResult) {
  LSBluetoothPlugin.cancelDeviceBinding(scanResult);
}

/**
 * 绑定设备（手环，手表）过程中，输入随机码校验
 * @param deviceMac
 * @param randomNum
 * @param onSettingListener
 */
export function pushSettingsRandomNum(deviceMac, randomNum, onSettingListener) {
  //提示 输入随机数
  let randomNumSett = new LSBluetoothPlugin.SettingProfile.RandomNumSetting(randomNum);
  LSBluetoothPlugin.pushSettings(deviceMac, randomNumSett, onSettingListener);
}

/**
 * 绑定设备过程中（互联蓝牙秤），写入设备ID(可以使用mac做为deviceId)
 * @param deviceMac
 * @param deviceId
 * @param onSettingListener
 */
export function pushSettingsRegisterId(deviceMac, deviceId, onSettingListener) {
  //提示 注册互联秤设备ID
  let idSetting = new LSBluetoothPlugin.SettingProfile.RegisterIdSetting(deviceId);
  pushSettings(deviceMac,idSetting, onSettingListener)
}

/**
 * 设置，必须连接上设备，否则会设置失败
 * @param deviceMac
 * @param idSetting
 * @param callback
 */
export function pushSettings(deviceMac, idSetting, callback) {
  const _noneSettingCallback= {
    onFailure: () => {},
    onSuccess: () => {}
  };

  LSBluetoothPlugin.pushSettings(deviceMac, idSetting, callback || _noneSettingCallback);
}

/**
 * 开启设备同步
 */
export function startDeviceSync() {

  console.log("[Device Manager] start device data sync", LSBluetoothPlugin.isStartSyncing());
  if (LSBluetoothPlugin.isStartSyncing()) {
    LSBluetoothPlugin.startConnectDevice();
  } else {
    LSBluetoothPlugin.startDataSync(_syncCallback)
  }
}
export function stopDeviceSync() {
    LSBluetoothPlugin.stopDataSync('tag');

}

export function addDevice(device,callback) {
  let bluetoothConnectId = wx.getStorageSync('ConnectId' + device.deviceMac);
  device.bluetoothConnectId = bluetoothConnectId;
  LSBluetoothPlugin.addMeasureDevice(device, (res) => {
    if (res.code === 200) {
      console.log("addMeasureDevice succeed",res)
      deviceMap[device.deviceMac] = device;
      callback && callback(true, '');
    } else {
      console.log('addMeasureDevice fail', res);
      // wx.showToast({
      //   title: res.msg || '添加设备失败', icon: 'none',
      // });
      if (callback) {
        callback(false, res.msg);
      }

    }
  });
}

export function removeDevice(device) {
  try {
    delete deviceMap[device.deviceMac];
    
  } catch (e) {
  }
  try {
    LSBluetoothPlugin.removeDevice(device);
  } catch (e) {
  }

}

export function getDeviceMap() {
    return deviceMap;
}

/**
 * 获取设备电量
 */
export const readDeviceBattery = (deviceMac, cb) => {
  return LSBluetoothPlugin.readDeviceBattery(deviceMac, {
    onBatteryInfo: (deviceMac, status, batteryInfo) => {
      if (status) {
        cb(batteryInfo)
      }
    }
  })
};
