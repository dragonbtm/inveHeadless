/*jslint node: true */


"use strict";
var headlessWallet = require('../start.js');
var conf = require('core/conf.js');
var eventBus = require('core/event_bus.js');
var db = require('core/db.js');
var mutex = require('core/mutex.js');
var storage = require('core/storage.js');
var constants = require('core/constants.js');
var validationUtils = require("core/validation_utils.js");
var hashnethelper = require("./hashnethelper")
var wallet_id;




var redis = require("redis");
var client  = redis.createClient(conf.redisPORT, conf.redisIP);
conf.redisAUTH ? client.auth(conf.redisAUTH) : null;


if (conf.bSingleAddress)
	throw Error('can`t run in single address mode');

function initRPC() {
	var composer = require('core/composer.js');
	var network = require('core/network.js');

	var rpc = require('json-rpc2');
	var walletDefinedByKeys = require('core/wallet_defined_by_keys.js');
	var Wallet = require('core/wallet.js');
	var balances = require('core/balances.js');


    const moment = require("moment");

    client.on("error", function(error) {
        console.log(error);
    });

    client.on('ready', function(res){
    	console.log('redis is already')
    });

    /*
    * 	res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
		res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
		res.setHeader("X-Powered-By",' 3.2.1');
		res.setHeader("Content-Type", "text/html");
    * */

	var server = rpc.Server.$create({
		'websocket': true, // is true by default
		'headers': { // allow custom headers is empty by default
			'Access-Control-Allow-Origin': '*',
            "Access-Control-Allow-Headers":"X-Requested-With",
            "Access-Control-Allow-Methods":"PUT,POST,GET,DELETE,OPTIONS",
            "X-Powered-By":' 3.2.1',
            "Content-Type":"text/html"
		}
	});



	server.expose('getaddress', function(args, opt, cb) {
		mutex.lock(['rpc_getnewaddress'], function(unlock){
			walletDefinedByKeys.issueAddress(wallet_id, 0, 0, function(addressInfo) {
				unlock();
				cb(null, addressInfo.address);
			});
		});
	});



	server.expose('sendtoaddress', function(args, opt, cb) {

		console.log('sendtoaddress '+JSON.stringify(args));
		let start_time = Date.now();
        let now = moment().format("YYYY-MM-DD");

		let amount = conf.amount;
		let toAddress = args[0];
		let note = "test coin";
		var timestamp = Math.round(Date.now());
		var messageVersion ="1.0.0dev";

		//限制每天領取次數
		let key = toAddress + now;


		if (amount && toAddress) {
			if (validationUtils.isValidAddress(toAddress)){
				mutex.lock(['rpc_getnewaddress'], function(unlock){
                    client.get(key,(err,reply)=> {
                        if(err) {
                            console.log(JSON.stringify(err))
                        }else {
                        	if(reply) {
                        		let data = {msg:"the address have to received",time:reply};
                        		cb(JSON.stringify(data));
                                unlock();
							}else {
                                walletDefinedByKeys.issueAddress(wallet_id, 0, 0, function(addressInfo) {
                                    let fromAddress = addressInfo.address;
                                    //構造交易結構
                                    var obj = {
                                        fromAddress: fromAddress,
                                        toAddress: toAddress,
                                        amount: amount,
                                        timestamp,
                                        remark :note,
                                        vers:messageVersion
                                    };
                                    findAddressForJoint(fromAddress,(address)=>{
                                        obj.pubkey = address.definition[1].pubkey;
                                        obj.type = 1;

                                        obj.fee = getStrLeng(JSON.stringify(obj));

                                        //获取签名的BUF
                                        var buf_to_sign = require("core/object_hash").getUnitHashToSign(obj);

                                        headlessWallet.signWithLocalPrivateKey(wallet_id,0,0,0,buf_to_sign,(signature,pubkey)=>{

                                            obj.signature = signature;

                                            let flag = require("core/signature").verify(buf_to_sign,signature,obj.pubkey);
                                            console.log("==========result",flag)

                                            hashnethelper.sendMessageTry(obj,pubkey,(err,res)=>{

                                                if(err) {
                                                	console.log(err);
                                                    cb(err,"faild");
                                                }else{
                                                    var res = JSON.parse(res);
                                                    if(res.code == 200) {
                                                        client.set(key,start_time,redis.print);
                                                        cb(null,signature);
                                                    }else {
                                                    	console.log(res.data);
                                                        cb("faild");
                                                    }

                                                }
                                                unlock();
                                            });



                                        });


                                    });




                                });

							}
                        }
                    });


				});

			}
			else
				cb("invalid address");
		}
		else
			cb("wrong parameters");
	});

	headlessWallet.readSingleWallet(function(_wallet_id) {
		wallet_id = _wallet_id;
		// listen creates an HTTP server on localhost only
		var httpServer = server.listen(conf.rpcPort, conf.rpcInterface);
		httpServer.timeout = 900*1000;
	});
}



function findAddressForJoint(address ,cb) {
	db.query("SELECT wallet, account, is_change, address_index,definition \n\
        FROM my_addresses JOIN wallets USING(wallet) \n\
        WHERE address=? ", address,(row)=>{
		row = row[0];
		var data = {
			definition: JSON.parse(row.definition),
			wallet: row.wallet,
			account: row.account,
			is_change: row.is_change,
			address_index: row.address_index
		};

		cb(data);
	});

}

function getStrLeng(str){
	var realLength = 0;
	var len = str.length;
	var charCode = -1;
	for(var i = 0; i < len; i++){
		charCode = str.charCodeAt(i);
		if (charCode >= 0 && charCode <= 128) {
			realLength += 1;
		}else{
			// 如果是中文则长度加2
			realLength += 2;
		}
	}
	return ((realLength/1024*1000000000).toFixed(0))
}

eventBus.on('headless_wallet_ready', initRPC);
