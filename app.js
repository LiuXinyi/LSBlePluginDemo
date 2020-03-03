//app.js

//引入插件
import {initManager} from "./pages/DeviceMananer";


App({
  onLaunch: function () {
    //sdk 初始化
    initManager(res=>{
        if(res){
            console.log('蓝牙插件初始化成功')
        }
    })

  }
})