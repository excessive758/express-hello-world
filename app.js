const express = require('express')
const path = require("path");
const app = express()

const os = require('os');
const winston = require('winston');
require('winston-syslog');

const bodyParser = require('body-parser');
// 使用 body-parser 中间件来解析 JSON 请求体
app.use(bodyParser.json());

const multer = require('multer');
const upload = multer();

const CryptoJS = require('crypto-js');

const papertrail = new winston.transports.Syslog({
  host: 'logs4.papertrailapp.com',
  port: 51431,
  protocol: 'tls4',
  localhost: os.hostname(),
  eol: '\n',
});

// const logger = winston.createLogger({
//   // format: winston.format.simple(),
//   format: winston.format.printf(({ level, message, timestamp }) => {
//     return `${level}: ${message}`;
//   }),
//   levels: winston.config.syslog.levels,
//   transports: [papertrail],
// });

// 创建 logger
const logger = winston.createLogger({
  // format: winston.format.combine(
  //   winston.format.timestamp(),
  //   winston.format.printf(({ level, message, timestamp }) => {
  //     return `${level}: ${message}`;
  //   })
  // ),
  // format: winston.format.combine(
  //   // winston.format.timestamp(),
  //   winston.format.splat(), // 启用 splat 格式化器
  //   winston.format.printf(info => {
  //     return `${info.level}: ${info.message}`; // 自定义日志消息格式
  //   })
  // ),
  format: winston.format.combine(
      // winston.format.timestamp(),
      winston.format.splat(), // 启用 splat 格式化器
      // winston.format.json(),
      winston.format.printf(info => {
        return `${info.level}: ${info.message}`; // 自定义日志消息格式
      })
    ),
  transports: [papertrail],
});

// 保存原始的console.log函数
const originalConsoleLog = console.log;

// 重写console.log函数，使其同时输出到控制台和Winston
// console.log = function() {
//     // 调用Winston的日志记录器输出日志
//     logger.info.apply(logger, arguments);
    
//     // 调用原始的console.log函数输出日志到控制台
//     originalConsoleLog.apply(console, arguments);
// };

// 重定向 console.log 到 winston 的日志记录器
// console.log = function(message) {
//   logger.info(message);
// };

// logger.info('hello papertrail');

// logger.info('hello %d',123);
// logger.info('hello %s',123);
// logger.info('hello %s'+123);


// #############################################################################
// Logs all request paths and method
app.use(function (req, res, next) {
  res.set('x-timestamp', Date.now())
  // res.set('x-powered-by', 'cyclic.sh')
  console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.path}`);
  next();
});

// #############################################################################
// This configures static hosting for files in /public that have the extensions
// listed in the array.
var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html','css','js','ico','jpg','jpeg','png','svg'],
  index: ['index.html'],
  maxAge: '1m',
  redirect: false
}
app.use(express.static('public', options))



// 定义路由，监听路径为 /log
// 监听路径为 /log 的 GET 请求
// 定义路由，监听路径为 /log
app.get('/l', (req, res) => {
  // 获取查询参数 l 的值
  const logValue = req.query.l;

  // 打印查询参数的值
  console.log('Value of "l":', logValue);
  logger.info(logValue)

  // 发送响应
  res.send('ok');
});

// 定义路由，监听路径为 /log
app.post('/l', (req, res) => {
  // console.log('Received log data:', req);
  // 获取 POST 请求中的 JSON 数据
  const logData = req.body;

  // 打印 JSON 数据
  console.log('Received log data:', logData);
  logger.info(logData);

  // 发送响应
  res.send('ok');
});


// 定义路由，监听路径为 /l
app.post('/l2', upload.none(), (req, res) => {
  // console.log('Received log data:', req.body);
  // 获取 POST 请求中的 JSON 数据
  var logData;
  if (2 == req.body.v) {
    logData = JSON.parse(decrypt(req.body.l, 'pyuudgmgv6p4b3'));
  } else {
    logData = JSON.parse(req.body.l);
  }

  // 打印 JSON 数据
  console.log('Received log data: %s', JSON.stringify(logData));
  // logger.info("h:%s d:%s n:%s l:%s", logData.c.h, logData.c.d, logData.c.n, JSON.stringify(logData));
  logger.info(JSON.stringify(logData));

  // 发送响应
  res.send('ok');
});

// AES 解密函数
function decrypt(ciphertext, key) {
  const bytes  = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

app.get('/l2', (req, res) => {
  // 获取查询参数 l 的值
  const logValue = req.query.l;

  const forwardedFor = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;

  // 打印查询参数的值
  console.log('ip %o, xip %o, req %o, header %o', req.ip, forwardedFor, req.query, req.headers);
  logger.info('ip %o, req %o, header %o, rip %o', forwardedFor, req.query, JSON.stringify(req.headers), req.ip);

  // 发送响应
  res.send('ok');
});

// #############################################################################
// Catch all handler for all other request.
app.use('*', (req,res) => {
  const forwardedFor = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;
  // console.log('path %o, ip %o', req.originalUrl, forwardedFor)
  logger.info('path %o, ip %o', req.originalUrl, forwardedFor)
  res.send(req.ip)
  // res.json({
  //     // at: new Date().toISOString(),
  //     // method: req.method,
  //     // hostname: req.hostname,
  //     ip: req.ip,
  //     // query: req.query,
  //     // headers: req.headers,
  //     // cookies: req.cookies,
  //     // params: req.params
  //   })
  //   .end()
})

module.exports = app
