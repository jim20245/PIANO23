const WebSocket = require('ws');
const motor = require('./motor.js');

const SERVER_URL = 'wss://lovechopin-production-md6c.up.railway.app';
const DEVICE_ID = 'dino-001';

let ws = null;
let heartbeatInterval = null;

function connect() {
    console.log(`[${new Date().toISOString()}] 正在连接服务器....`);
    
    ws = new WebSocket(SERVER_URL);

    ws.on('open', () => {
        console.log('[${new Date().toISOString()}] 已连接服务器');

        ws.send(JSON.stringify({
            type: 'register',
            deviceId: DEVICE_ID
        }));
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'heartbeat',
                    deviceId: DEVICE_ID
                }));
                console.log(`[${new Date().toISOString()}] 心跳发送`);
            }
        }, 30000);
    });

    ws.on('message', (data) => {
        try{
            const msg = JSON.parse(data);
            console.log(`[${new Date().toISOString()}] 收到指令：`, msg);

            if (msg.type === 'command') {
                handleCommand(msg);
            }
        } catch (e)  {
            console.error(' 指令解析失败:', e);
        }
    });

    

    ws.on('error', (err) => {
        console.error(`[${new Date().toISOString()}] WebSocket 错误：`, error);
        
    });

    ws.on('close', () => {
        console.log(`[${new Date().toISOString()}] 连接断开，5秒后重连...`);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        setTimeout(connect, 5000);
    });
}

function handleCommand(command) {
    const { action, motor: motorName, duration } = command;

    switch (action) {
        case 'on':
            motor.on(motorName);
            break;
        case 'off':
            motor.off(motorName);
        case 'pulse':
            motor.pulse(motorName, duration || 500);
            break;
        default:
            console.log(` 未知指令: ${action}`);
    }
}  

console.log(`[${new Date().toISOString()}] 恐龙控制器启动`);
console.log(`设备 ID: ${DEVICE_ID}`);
connect();

process.on('SIGINT', () => {
    console.log('\n正在退出...');
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (ws) ws.close();

    const { exec } = require('child_process');
    exec('python3 /home/pi/dino/motor.py cleanup');

    setTimeout(() => {
        process.exit(0);
    }, 500);
});