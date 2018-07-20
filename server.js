// Nodejs实现匿名聊天群，欢迎开车
// https://github.com/kylescript/nodejs-chat

// 定义消息前缀，表示特定的含义
const prefix_new_id = '[ID_NEW]';       // 分配名字给新用户
const prefix_change_id = '[ID_CHANGE]'; // 老用户换名字
const prefix_use_id = '[ID_USE]';       // 老用户用cookie里的老名字
const prefix_message_text = '[MESSAGE_TEXT]';   // 文本消息
const prefix_message_photo = '[MESSAGE_PHOTO]'; // 图片消息
// 文本消息名字、内容分隔符
const split_str = "#9527#";

const anyone = require('./anyone.js');
const WebSocket = require('ws');
const wss = new WebSocket.Server({port: 9527});

// 给WebSocket类添加一个user属性，以区分用户
WebSocket.prototype.user = "";

// 初始化备用用户名
anyone.init();

// 广播用户消息, toUser=-1 表示全员广播
function send_user_message(toUser, owner, message) {
    // 广播
    if (toUser === -1) {
        wss.clients.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(prefix_message_text + owner + split_str + message);
            }
        });
        return;
    }

    // 发给特定用户
    wss.clients.forEach(function (client) {
        if (client.user === toUser && client.readyState === WebSocket.OPEN) {
            client.send(prefix_message_text + owner + split_str + message);
            return;
        }
    });
}

// 新的用户来了
wss.on('connection', ws => {
    console.log("New User connected...");

    // 处理客户端发来的消息
    ws.on('message', m => {
        console.log('Recv:' + m);
        if (m.startsWith(prefix_new_id)) {  // 分配名字给新用户
            // 已经有名字了，客户端逻辑出问题了，不做任何处理
            if (ws.user !== "") {
                return;
            }
            ws.user = anyone.apply_name();
            ws.send(prefix_new_id + ws.user);
        } else if (m.startsWith(prefix_change_id)) { // 老用户换名字
            // 还没有名字，客户端逻辑出问题了，不做任何处理
            if (ws.user === "") {
                return;
            }
            anyone.set_name_status(ws.user, false);
            ws.user = anyone.apply_name();
            ws.send(prefix_new_id + ws.user);
        } else if (m.startsWith(prefix_use_id)) { // 老用户用cookie里的老名字
            // 已经有名字了，客户端逻辑出问题了，不做任何处理
            if (ws.user !== "") {
                return;
            }
            // 已经被占用了, 分配一个新名字吧
            if (anyone.get_name_usage(m.substring(prefix_use_id.length))) {
                ws.user = anyone.apply_name();
            } else {
                ws.user = m.substring(prefix_use_id.length);
                anyone.set_name_status(ws.user, true);
            }
            ws.send(prefix_new_id + ws.user);
        } else if (m.startsWith(prefix_message_text)) { // 文本消息
            // 广播消息
            send_user_message(-1, ws.user, m.substring(prefix_message_text.length));
        } else if (m.startsWith(prefix_message_photo)) { // 图片消息
            console.log('not support photo message.');
        }
    });

    // 客户端断开连接
    ws.on('close', () => {
        console.log("disconnected:" + ws.user);
        anyone.set_name_status(ws.user, false);
    });
});

wss.on('error', err => {
    console.log('ERROR:' + err);
});
