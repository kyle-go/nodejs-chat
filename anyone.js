/*
	Nodejs实现匿名聊天群，欢迎开车
	https://github.com/kylescript/nodejs-chat

    从百度搜索排行榜上爬取一些名人，作为用户名字
*/

const http = require('http');
const iconv = require('iconv-lite');
const BufferHelper = require('bufferhelper');

let user_names = [];

function get_hot_man(callback) {
    http.get('http://top.baidu.com/category?c=9', (res) => {
        let data = new BufferHelper();
        res.on('data', d => {
            data.concat(d);
        });
        res.on('end', () => {
            data = iconv.decode(data.toBuffer(), 'gb2312');
            let result = [];

            let last_pos = 0;
            let start = "<a target=\"_blank\" title=\"";
            let pos = data.indexOf(start, last_pos);
            while (pos !== -1) {
                last_pos = pos + start.length + 1;
                let pos_point = data.indexOf("\"", last_pos);
                if (pos_point > 0) {
                    last_pos = pos_point + 1;
                    let name = data.substring(pos + start.length, pos_point);
                    if (!(name in result)) {
                        result[name] = 1;
                    }
                }
                pos = data.indexOf(start, last_pos);
            }
            callback(result);
        });
    }).on('error', (e) => {
        console.error(e);
    });
}

// 初始化名字库
exports.init = () => {
    get_hot_man(famous => {
        for (let name in famous) {
            user_names.push({"name": name, "used": false});
        }
    });
};

// 从名字库中寻找一个可用名字
exports.apply_name = () => {
    let len = user_names.length;

    // 随机10次找一个没有被占用的名字
    for (let i = 0; i < 10; i++) {
        let rand_index = parseInt(Math.random() * len);
        if (user_names[rand_index]['used'] === false) {
            user_names[rand_index]['used'] = true;
            return user_names[rand_index]['name'];
        }
    }

    // 从头找第一个没被占用的名字
    for (let i = 0; i < len; i++) {
        if (user_names[i]['used'] === false) {
            user_names[i]['used'] = true;
            return user_names[i]['name'];
        }
    }

    // 名字不够分配了
    return ""
};

// 释放/占用名字占用， false-始放 true-占用
exports.set_name_status = (name, status) => {
    for (let i = 0; i < user_names.length; i++) {
        if (user_names[i]['name'] === name) {
            user_names[i]['used'] = status;
            return;
        }
    }
};

exports.get_name_usage = name => {
    for (let i = 0; i < user_names.length; i++) {
        if (user_names[i]['name'] === name) {
            return user_names[i]['used'];
        }
    }

    // 这种异常名字当作已被占用处理
    return true;
};