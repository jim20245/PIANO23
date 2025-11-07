const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
// 使用环境变量PORT，如果不存在则使用3000
const PORT = process.env.PORT || 3000;

// 配置静态文件服务
// 在生产环境中，这可能由前端部署处理，这里保留用于本地开发
app.use(express.static(path.join(__dirname, '..')));

// 配置CORS中间件
app.use((req, res, next) => {
    // 在生产环境中应该限制为特定域名
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

app.use(express.json());

const USERS_FILE = path.join(__dirname, 'users.json');

app.post('/register', async (req, res) => {
    
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({
            success: false,
            message: '请提供用户名和密码'
        });
    }
    
    
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        users = JSON.parse(data);
    }
    
    const userExists = users.find(user => user.username === username);
    if (userExists) {
        return res.json({
            success: false,
            message: '用户名已存在'
        });
    }
    const saltRounds = 12;
    const hashedPassword = awaits bcrypt.hash(password, saltRounds);
    
    const newUser = {
        id: users.length + 1,
        username: username,
        password: hashedPassword,
        created: new Date().toLocaleString()
    };
    
    users.push(newUser);
    
    fs.writeFileSync(USERS_FILE, JSON.stringify(users,null,2));
    
    res.json({
        success: true,
        message: '注册成功！'
    });
    
});

app.post('/login', async (req,res)  => {
    console.log('收到登录请求：', req.body);

    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({
            success: false,
            message: '请提供用户名和密码'
        });
    }

    if (!fs.existsSync(USERS_FILE)) {
        return res.json({
            success: false,
            message: '用户不存在'
        });

    }

    const data =fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(data);

    const user = users.find(u => u.username === username && u.password === password);

    
        const isPasswordValid = await bcrypt.compare(password,user.password);
        if (isPasswordValid) {
        res.json({
            success: true,
            message: '登录成功',
            user: {
                id: user.id,
                username: user.username
            }
        });
    } else {
        res.json({
            success: false,
            message: '用户名或密码错误'
        });
    }
});

app.get('/users', (req, res) => {
    if (fs.existsSync(USERS_FILE)){
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        res.json(users);
    } else {
        res.json([]);
    }
});


// 添加根路径重定向到register.html
app.get('/', (req, res) => {
    res.redirect('/register.html');
});

// 添加一个健康检查端点，这对Railway很有用
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log('后端服务器启动成功！');
    console.log('服务器地址：http://localhost:' + PORT);
    console.log('');
    console.log('可用接口：');
    console.log(' POST /register - 用户注册');
    console.log(' POST /login    - 用户登录');
    console.log(' GET  /users    - 查看所有用户');
    console.log(' GET  /health   - 健康检查');
    console.log('');
});

