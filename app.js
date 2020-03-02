//app.js

//引入插件
import {initManager} from "./pages/DeviceMananer";


App({
  onLaunch: function () {
    //sdk 初始化
    initManager()

  }
})