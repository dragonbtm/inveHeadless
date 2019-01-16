/*jslint node: true */
"use strict";

//exports.port = 6611;
//exports.myUrl = 'wss://mydomain.com/bb';
exports.bServeAsHub = false;
exports.bLight = true;

const unit = "000000000000000000";
exports.amount = "100" + unit;
exports.storage = 'sqlite';

//局部全節點地址
exports.localFullNode = "18.191.18.104:30003";

//配置錢包
exports.words = "enroll mammal token pioneer creek clap toss enroll tenant else grit twin";
exports.passphrase = "";

//redis配置信息
exports.redisIP   = "localhost";
exports.redisPORT = "1000";
exports.redisAUTH = "alsdnvals/dfjawei9fsdfnas123324235";



exports.WS_PROTOCOL = 'ws://';
// exports.hub = '192.168.5.149:8286';
exports.deviceName = 'Headless';
exports.permanent_pairing_secret = 'randomstring';
exports.control_addresses = ['DEVICE ALLOWED TO CHAT'];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';
exports.KEYS_FILENAME = 'keys.json';

// where logs are written to (absolute path).  Default is log.txt in app data directory
//exports.LOG_FILENAME = '/dev/null';

// consolidate unspent outputs when there are too many of them.  Value of 0 means do not try to consolidate
exports.MAX_UNSPENT_OUTPUTS = 0;
exports.CONSOLIDATION_INTERVAL = 3600*1000;

// this is for runnining RPC service only, see play/rpc_service.js
// exports.rpcInterface = '127.0.0.1';
exports.rpcPort = '6332';

console.log('finished headless conf');
