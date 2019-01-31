'use strict';

// const Ice = require("ice").Ice;
// const rpc = require("./Hashnet").one.inve.rpc;
const webHelper = require("./webhelper.js");
const conf = require("../conf")
const seed ="http://18.236.139.151:25003";
const secrethelper = require("./secrethelper.js");
const localfullnodes = [];
//与共识网交互的类
class HashnetHelper {
    //直接调用共识网的发送交易接口
    static async sendMessageTry(unit,pubkey) {
        let address = unit.fromAddress;
        //获取局部全节点
        try {
            let localfullnode = await HashnetHelper.buildSingleLocalfullnode(address, pubkey);
            if(!localfullnode) {
                return "get localfullnode err";
            }else {
                let message = JSON.stringify(unit);
                console.log("sending unit:", message);
                //往共识网发送交易
                return await webHelper.httpPost(getUrl("http://" + localfullnode, '/v1/sendmsg'), null, buildData({message}));
            }


        } catch (e) {
            //处理失效的局部全节点
            // if (localfullnode) {
            //     await HashnetHelper.reloadLocalfullnode(localfullnode);
            // }
			var err = JSON.stringify({"code":500,"data":"network error,please try again."});
			console.log(err);
			return err;
        }
    }

    static async buildSingleLocalfullnode(address,pubKey) {
            //从种子节点处获取局部全节点列表
        if(localfullnodes.length == 0){//如果本地没有缓存，则从
            let localfullnode = await HashnetHelper.getLocalfullnodeList(address,pubKey);
            localfullnodes[secrethelper.random(0, localfullnodes.length - 1)] = localfullnode;
        }
        return localfullnodes[secrethelper.random(0, localfullnodes.length - 1)];
    }

    static  async getLocalfullnodeList(address,pubkey,cb2) {
        try {
            //从种子节点那里拉取局部全节点列表
            let result = JSON.parse(await webHelper.httpPost(seed + '/v1/getlocalfullnodes', null, buildData({pubkey})));

                if(result.code != 200) return [];
                let localfullnodeListMessage = result;
                let localfullnodeList = localfullnodeListMessage.data;
                if (localfullnodeListMessage.code == 200 && localfullnodeList != '') {
                    localfullnodeList = JSON.parse(localfullnodeList);
                    for(let i in localfullnodeList){
                        let l = localfullnodeList[i].ip + ':' + localfullnodeList[i].httpPort;
                        localfullnodes.push(l)
                    }
                    return localfullnodeList;
                }
                else {
                    //如果没有拉取到，则返回空数组。
                    console.log("got no localfullnodeList");
                    return [];
                }

        }
        catch (e) {
            console.log(e.toString());
            return [];
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
