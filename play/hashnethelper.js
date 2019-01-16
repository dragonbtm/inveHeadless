'use strict';

// const Ice = require("ice").Ice;
// const rpc = require("./Hashnet").one.inve.rpc;
const webHelper = require("./webhelper.js");
const conf = require("../conf")
//与共识网交互的类
class HashnetHelper {
    //直接调用共识网的发送交易接口
    static  sendMessageTry(unit,callback) {
    	let localfullnode = "http://" + conf.localFullNode;
        //获取局部全节点
        try {
            if (!localfullnode) {
                throw new Error('network error, please try again.');
            }

            let message = JSON.stringify(unit);
			console.log("sending unit:" ,message);
            //往共识网发送交易
            webHelper.httpPost(getUrl(localfullnode, '/v1/sendmsg'), null, buildData({message}),callback);
        }
        catch (e) {
            //处理失效的局部全节点
            // if (localfullnode) {
            //     await HashnetHelper.reloadLocalfullnode(localfullnode);
            // }
			var err = JSON.stringify({"code":500,"data":"network error,please try again."});
			console.log(err);
			callback(err)
        }
    }

}
//组装访问共识网的url
let getUrl = (localfullnode, suburl) => {
    return localfullnode + suburl;
}
//组装往共识网发送数据的对象
let buildData = (data) => {
    return JSON.parse(JSON.stringify(data));
}


module.exports = HashnetHelper;