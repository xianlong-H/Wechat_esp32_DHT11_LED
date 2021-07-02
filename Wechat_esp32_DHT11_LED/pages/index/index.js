// index.js
// 获取应用实例
const app = getApp()
import mqtt from '../../utils/js/mqtt.min.js';//加载mqtt库

Page({
  data: {
    uid:"fcaad2e7f597b6bd81942b52d640bdf1",//用户密钥，巴法云控制台获取
    ledtopic:"led",//控制led的主题，mqtt控制台创建
    fantopic:"fan",//控制fan的主题，mqtt控制台创建
    dhttopic:"temp",//传输温湿度的主题，控制台创建
    device_status:"离线",// 显示led是否在线的字符串，默认离线
    AlarmOnOff:"烟感浓度正常",
    checked: false,//led的状态。默认led关闭
    checked1: false,//fan的状态。默认fan关闭
    wendu:"",//温度值，默认为空
    shidu:"",//湿度值，默认为空
    mq:"",
    ledicon:"/utils/img/lightoff.png",//显示led图标的状态。默认是关闭状态图标
    fanicon:"/utils/img/fanoff.png",//显示fan图标的状态。默认是关闭状态图标
    client: null,//mqtt客户端，默认为空
  },

  mqttConnect(){
    var that = this
    
    //MQTT连接的配置
    var options= {
      keepalive: 60, //60s ，表示心跳间隔
      clean: true, //cleanSession不保持持久会话
      protocolVersion: 4, //MQTT v3.1.1
      clientId:this.data.uid
    }
    //初始化mqtt连接
     this.data.client = mqtt.connect('wxs://bemfa.com:9504/wss',options)
     // 连接mqtt服务器
     this.data.client.on('connect', function () {
      console.log('连接服务器成功')
      //订阅dht11温湿度主题
      that.data.client.subscribe(that.data.dhttopic, function (err) {
        if (err) {
            console.log(err)
        }
      })
    })
    //接收消息
    that.data.client.on('message', function (topic, message) {
      console.log(topic+'topic')
      var  msg = message.toString()
      if(topic == that.data.dhttopic){//如果是温湿度主题的消息
        //假设上传的数据为#23#45#off，其中温度是23，湿度45，led为关闭状态
        if(msg.indexOf("#") != -1){//如果数据里包含#号，表示获取的是传感器值，因为单片机上传数据的时候用#号进行了包裹
          //如果有#号就进行字符串分割
          var all_data_arr = msg.split("#"); //分割数据，并把分割后的数据放到数组里。
          console.log(all_data_arr)//打印数组
          if(all_data_arr[6] != undefined){//判断是否上传了led状态
                if(all_data_arr[6] == "Alarm!"){//如果单片机处于打开状态
                    that.setData({ //数据赋值给变量
                      AlarmOnOff:"烟感浓度过高，注意火灾！",//赋值led状态
                    })
                }else{
                  that.setData({ //数据赋值给变量
                    AlarmOnOff:"烟感浓度正常",//赋值led状态
                  })
                }
          }
          that.setData({ //数据赋值给变量
            wendu:all_data_arr[1],//赋值温度
            shidu:all_data_arr[2], //赋值湿度
            mq:all_data_arr[3],//复制烟感
          })
        }
      }
      //打印消息
      console.log('收到消息：'+msg)
    })

    //断线重连
    this.data.client.on("reconnect", function () {
      console.log("重新连接")
    });


  },

//屏幕打开时执行的函数
  onLoad() {

    //连接mqtt
    this.mqttConnect()
    //检查设备是否在线
    this.getOnline()
    //检查设备是打开还是关闭
    this.getOnOff()
    //获取服务器上现在存储的dht11数据
    this.getdht11()
  },
  //控制灯的函数1，小滑块点击后执行的函数
  onChange({ detail }){
    //detail是滑块的值，检查是打开还是关闭，并更换正确图标
    this.setData({ 
      checked: detail,
     });
     if(detail == true){//如果是打开操作
      this.data.client.publish(this.data.ledtopic, 'ledon')//mqtt推送on
      this.setData({ 
        ledicon: "/utils/img/lighton.png",//设置led图片为on
       });
     }else{
      this.data.client.publish(this.data.ledtopic, 'ledoff')//mqtt推送off
      this.setData({ 
        ledicon: "/utils/img/lightoff.png",//设置led图片为off
       });
     }
  },
  //点击led图片执行的函数
  onChange2(){
    var that = this
      //如果点击前是打开状态，现在更换为关闭状态，并更换图标，完成状态切换
      if( that.data.checked == true){
        this.data.client.publish(this.data.ledtopic, 'ledoff')
        this.setData({ 
            ledicon: "/utils/img/lightoff.png",//设置led图片为off
            checked:false //设置led状态为false
         });
      }else{
        //如果点击前是关闭状态，现在更换为打开状态，并更换图标，完成状态切换
        this.data.client.publish(this.data.ledtopic, 'ledon')
        that.setData({ 
          ledicon: "/utils/img/lighton.png",//设置led图片为on
          checked:true//设置led状态为true
       });
      }
  },
    //控制风扇的函数1，小滑块点击后执行的函数
    onChange3({ detail }){
      //detail是滑块的值，检查是打开还是关闭，并更换正确图标
      this.setData({ 
        checked1: detail,
       });
       if(detail == true){//如果是打开操作
        this.data.client.publish(this.data.fantopic, 'fanon')//mqtt推送on
        this.setData({ 
          fanicon: "/utils/img/fanon.png",//设置led图片为on
         });
       }else{
        this.data.client.publish(this.data.fantopic, 'fanoff')//mqtt推送off
        this.setData({ 
          fanicon: "/utils/img/fanoff.png",//设置led图片为off
         });
       }
    },
    //点击led图片执行的函数
    onChange4(){
      var that = this
        //如果点击前是打开状态，现在更换为关闭状态，并更换图标，完成状态切换
        if( that.data.checked1 == true){
          this.data.client.publish(this.data.fantopic, 'fanoff')
          this.setData({ 
              fanicon: "/utils/img/fanoff.png",//设置led图片为off
              checked1:false //设置led状态为false
           });
        }else{
          //如果点击前是关闭状态，现在更换为打开状态，并更换图标，完成状态切换
          this.data.client.publish(this.data.fantopic, 'fanon')
          that.setData({ 
            fanicon: "/utils/img/fanon.png",//设置led图片为on
            checked1:true//设置led状态为true
         });
        }
    },
  getOnline(){
    var that = this
    //请求设备状态,检查设备是否在线
     //api 接口详细说明见巴法云接入文档
    wx.request({
      url: 'https://api.bemfa.com/mqtt/status/', //状态api接口，详见巴法云接入文档
      data: {
        uid: that.data.uid,
        topic: that.data.ledtopic,
      },
      header: {
        'content-type': "application/x-www-form-urlencoded"
      },
      success (res) {
        console.log(res.data)
        if(res.data.status === "online"){
          that.setData({
            device_status:"在线"
          })
        }else{
          that.setData({
            device_status:"离线"
          })
        }
        console.log(that.data.device_status)
      }
    })    
  },
  getOnOff(){
    //获取设备状态，检查设备是打开还是关闭
    //api 接口详细说明见巴法云接入文档
    var that = this
    wx.request({
      url: 'https://api.bemfa.com/api/device/v1/data/3/get/', //状态api接口，详见巴法云接入文档
      data: {
        uid: that.data.uid,
        topic: that.data.ledtopic,
        num:1
      },
      header: {
        'content-type': "application/x-www-form-urlencoded"
      },
      success (res) {
        console.log(res)
        console.log(res.data.data[0].msg)
        if(res.data.data[0].msg == "ledon"){
          that.setData({
            checked:true,
          //  ledOnOff:"打开",
            ledicon: "/utils/img/lighton.png",
          })
        }else{
          that.setData({
            checked:false,
           // ledOnOff:"关闭",
            ledicon: "/utils/img/lightoff.png",
          })
        }
      }
    })    
  },
  getdht11(){
    //获取温湿度值，屏幕初始化时，未订阅收到温湿度时，先去主动获取值
    //api 接口详细说明见巴法云接入文档
    var that = this
    wx.request({
      url: 'https://api.bemfa.com/api/device/v1/data/3/get/', //状态api接口，详见巴法云接入文档
      data: {
        uid: that.data.uid,
        topic: that.data.dhttopic,
        num:1
      },
      header: {
        'content-type': "application/x-www-form-urlencoded"
      },
      success (res) {
        console.log(res)
        console.log(res.data.data[0].msg)
        if(res.data.data[0].msg.indexOf("#") != -1){//如果数据里包含#号，表示获取的是传感器值，因为单片机上传数据的时候用#号进行了包裹
          //如果有#号就进行字符串分割
          var all_data_arr = res.data.data[0].msg.split("#"); //分割数据，并把分割后的数据放到数组里。
          console.log(all_data_arr)//打印数组
          that.setData({ //数据赋值给变量
            wendu:all_data_arr[1],//赋值温度
            shidu:all_data_arr[2], //赋值湿度
            mq:all_data_arr[3], //赋值烟感
          })
        }
      }
    })    
  }
})
