const WebSocket = require('ws');
const { exec } = require('child_process');

const SERVER_URL = 'wss://www.lovechopin.com';
const DEVICE_ID = 'dino-001';

let ws = null;
let heartbeatInterval = null;
let autoSwingInterval = null;
let currentAngle = 0;

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
            console.log(`[RAW] 收到: ${JSON.stringify(msg)}`);

            if (msg.action === 'angle') {
                
                const motorName = msg.motor || 'm1';
                const angle = msg.value !== undefined ? msg.value : 90;
                executeMotor(motorName, angle);
                return;
                
              
            } 

            if (msg.action === 'tail') {
                console.log(`[TAIL] 执行摆尾动作`);
                const cmd = `cd /home/pi/dino && /home/pi/dino/venv/bin/python motor.py tail`;
                exec(cmd, (error, stdout, stderr) => {
                    if (error) console.error(`[ERROR] ${error}`);
                    if (stdout) console.log(`[OUT] ${stdout.trim()}`);
                    if (stderr) console.error(`[ERR] ${stderr}`);
                });
                return;
            }

        

            if (msg.action === 'start') {
                startAutoSwing();
                return;
             
            }

            if (msg.action === 'stop') {
                stopAutoSwing();
                return;
                
            }

            if (msg.action === 'range') {
                startAutoSwing(msg.min || 0, msg.max || 180, (msg.interval || 2) * 1000);
                return;
            }
            
        } catch (e)  {
            console.error('解析错误:', e);
            
        }
    });

    

    ws.on('error', (err) => {
        console.error(`WebSocket 错误：`, err);
        
    });

    ws.on('close', () => {
        console.log(`连接断开，5秒后重连...`);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (autoSwingInterval) clearInterval(autoSwingInterval);
        setTimeout(connect, 5000);
    });
}

function executeMotor(motorName, angle) {
    const cmd = `cd /home/pi/dino && /home/pi/dino/venv/bin/python motor.py ${motorName} angle ${angle}`;
    console.log(`[EXEC] 执行: ${cmd}`);
    exec(cmd, (error, stdout, stderr) => {
        if (error) console.error(`[ERROR] ${error}`);
        if (stdout) console.log(`[OUT] ${stdout.trim()}`);
        if (stderr) console.error('[ERR] ${stderr}');
    });
}

function startAutoSwing(minAngle = 0, maxAngle = 180, intervalMs = 2000) {
    if (autoSwingInterval) clearInterval(autoSwingInterval);

    let current = minAngle;
    console.log(`[AUTO] 开始自动摇摆: ${minAngle} <_> ${maxAngle}, 间隔 ${intervalMs/1000}秒`);

    autoSwingInterval = setInterval(() => {
        executeMotor('m1', current);

        if (current === minAngle) {
            current = maxAngle;
        } else {
            current = minAngle;
        }
    }, intervalMs);
}

function stopAutoSwing() {
    if (autoSwingInterval) {
        clearInterval(autoSwingInterval);
        autoSwingInterval = null;
        console.log(`[AUTO] 停止自动摆动`);
    }
}



console.log(`[${new Date().toISOString()}] 恐龙控制器启动`);
console.log(`设备 ID: ${DEVICE_ID}`);
connect();

process.on('SIGINT', () => {
    console.log('\n正在退出...');
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (autoSwingInterval) clearInterval(autoSwingInterval);
    if (ws) ws.close();

  

    setTimeout(() => process.exit(0), 500);
       
    
});