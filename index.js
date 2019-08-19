const {
  Wechaty
} = require('wechaty')
const moment = require('moment')
const superagent = require('superagent')

let city = '宁波' // 天气城市

const config = {
  myname: '', // 我的微信名（是微信名不是备注）
  name: '', // 对方微信名
  dateTime: '10:00', // 定时任务执行时间
  roopTime: '60 * 1000', // 循环间隔
  startDate: '2017-06-05' // 纪念日开始日期
}

const bot = new Wechaty({
  name: "WecahtBot" // 保持登陆状态，不会因为登陆时间过长而下线
})
bot.on('scan', onScan)
bot.on('login', onLogin)
bot.on('message', onMessage)
bot.start()
  .then(() => console.log('登陆微信'))
  .catch(e => console.error(e))

// 生成登陆二维码
function onScan(qrcode, status) {
  require('qrcode-terminal').generate(qrcode)
  const qrcodeImageUrl = [
    'https://api.qrserver.com/v1/create-qr-code/?data=',
    encodeURIComponent(qrcode),
  ].join('')
  console.log(qrcodeImageUrl)
}

// 登录后执行定时任务
async function onLogin(user) {
  console.log(`${user}logined`)
  setInterval(() => {
    if (moment().format('HH:mm') == config.dateTime) {
      main()
    }
  }, config.roopTime)
}

// 接受消息并发送给处理函数
async function onMessage(msg) {
  const contact = msg.from()
  const text = msg.text()
  const room = msg.room()
  if (room) {} else {
    if (contact.name() == config.name) {
      await returnMEssage(contact, text)
    }
    if (contact.name() == config.myname) {
      let contact2 = await bot.Contact.find({
        name: config.name
      })
      await myMessage(contact2, text)
    }
  }
}

// 定时任务
async function main() {
  let contact = await bot.Contact.find({
    name: config.name
  })
  let today = getToday()
  let memday = madeDaySub()
  let weather = await getWeather()
  let text = `${today}<br>${memday}<br><br>${weather}`
  await contact.say(text)
}

// 获取今天信息
function getToday() {
  const week = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  var d1 = moment().format('YYYY-MM-DD')
  var d2 = week[moment().format('E') - 1]
  return d1 + ` (${d2})`
}

// 获取纪念日时长
function madeDaySub() {
  var d1 = moment()
  var d2 = moment(config.startDate)
  return '在一起' + d1.diff(d2, 'day') + '天啦'
}

// 获取天气信息
async function getWeather() {
  var str = encodeURI(city)
  const url = 'https://www.tianqiapi.com/api/?version=v1&city=' + str
  const res = await superagent.get(url)
  const data = res.body
  let resdata = `${data.city}天气：<br>${data.data[0].wea}，最高温度：${data.data[0].tem1}，最低温度：${data.data[0].tem2}<br><br>`
  data.data[0].index.forEach((item, i) => {
    if (i == 0 || i == 3) {
      resdata += `${item.title}：${item.level}，${item.desc}<br>`
    }
  })
  resdata += `<br>明天天气：<br>${data.data[1].wea}，最高温度：${data.data[1].tem1}，最低温度：${data.data[1].tem2}<br><br>后天天气：<br>${data.data[2].wea}，最高温度：${data.data[2].tem1}，最低温度：${data.data[2].tem2}`
  return resdata
}

// 处理信息并返回信息
async function returnMEssage(contact, text) {
  // 发送信息给自己(使用小号就需要发送给自己)
  // sendMsgToMe(text)
  // 返回今日信息
  if (text == '今天') {
    main()
  }
  // 修改天气城市
  else if (text.indexOf('城市to') >= 0) {
    city = text.split('to')[1]
    await contact.say('已改变城市')
  }
  // 返回天气信息
  else if (text == '天气') {
    let weather = await getWeather()
    await contact.say(weather)
  }
}

async function myMessage(contact, text) {
  await returnMEssage(contact, text)
}

// 发送信息给我自己
async function sendMsgToMe(text) {
  let contact = await bot.Contact.find({
    name: config.myname
  })
  await contact.say(text)
}