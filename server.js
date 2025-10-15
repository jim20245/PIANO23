const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt'); // 用于密码哈希处理
const { db, dbType, connectWithRetry } = require('./db'); // 引入数据库连接模块

const app = express();
// 使用环境变量PORT，如果不存在则使用3000
const PORT = process.env.PORT || 3000;

// 配置静态文件服务 - 确保正确提供前端HTML文件
// 指向backend目录的父目录，其中包含register.html和login.html
app.use(express.static(path.join(__dirname, '..')));

// 配置CORS中间件
app.use((req, res, next) => {
    // 在生产环境中使用通配符，以确保通过相对路径的API调用能够正常工作
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

// 密码哈希配置
const SALT_ROUNDS = 10;

// 为根路径设置默认重定向到register.html
app.get('/', (req, res) => {
    res.redirect('/register.html');
});

app.post('/register', async (req, res) => {
    try {
        console.log('收到注册请求：', req.body);
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '请提供用户名和密码'
            });
        }
        
        if (username.length < 3 || username.length > 9) {
            return res.status(400).json({
                success: false,
                message: '用户名长度必须在3-9个字符之间'
            });
        }
        
        if (password.length < 6 || password.length > 9) {
            return res.status(400).json({
                success: false,
                message: '密码长度必须在6-9个字符之间'
            });
        }
        
        // 检查用户名是否已存在
        let existingUser;
        if (dbType === 'postgres') {
            const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
            existingUser = result.rows[0];
        } else {
            const [result] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
            existingUser = result[0];
        }
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: '用户名已存在'
            });
        }
        
        // 对密码进行哈希处理
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        // 创建新用户
        let newUser;
        if (dbType === 'postgres') {
            const result = await db.query(
                'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at',
                [username, hashedPassword]
            );
            newUser = result.rows[0];
        } else {
            await db.execute(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                [username, hashedPassword]
            );
            
            // 获取新创建的用户（不含密码）
            const [result] = await db.execute('SELECT id, username, created_at FROM users WHERE username = ?', [username]);
            newUser = result[0];
        }
        
        res.status(201).json({
            success: true,
            message: '注册成功！'
        });
    } catch (error) {
        console.error('注册处理异常:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

app.post('/login', async (req, res) => {
    try {
        console.log('收到登录请求：', req.body);

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '请提供用户名和密码'
            });
        }

        // 查询用户
        let user;
        if (dbType === 'postgres') {
            const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
            user = result.rows[0];
        } else {
            const [result] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
            user = result[0];
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 验证密码
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (passwordMatch) {
            // 不返回密码信息
            res.json({
                success: true,
                message: '登录成功',
                user: {
                    id: user.id,
                    username: user.username
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
    } catch (error) {
        console.error('登录处理异常:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误，请稍后重试'
        });
    }
});

app.get('/users', async (req, res) => {
    try {
        // 从数据库获取用户列表，不包含密码
        if (dbType === 'postgres') {
            const result = await db.query('SELECT id, username, created_at FROM users');
            res.json(result.rows);
        } else {
            const [result] = await db.execute('SELECT id, username, created_at FROM users');
            res.json(result);
        }
    } catch (error) {
        console.error('获取用户列表异常:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败'
        });
    }
});

// 添加一个健康检查端点
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// 服务器启动前初始化数据库连接
async function startServer() {
    try {
        console.log('正在连接到数据库...');
        const dbConnected = await connectWithRetry(5, 2000);
        
        if (!dbConnected) {
            console.error('数据库连接失败，无法启动服务器');
            process.exit(1);
        }
        
        // 启动服务器
        app.listen(PORT, () => {
            console.log(`后端服务器启动成功！`);
            console.log(`服务器地址：http://localhost:${PORT}`);
            console.log('');
            console.log('可用接口：');
            console.log(' POST /register - 用户注册');
            console.log(' POST /login    - 用户登录');
            console.log(' GET  /users    - 查看所有用户');
            console.log(' GET  /health   - 健康检查');
            console.log('');
            console.log('静态文件访问：');
            console.log(` http://localhost:${PORT}/register.html - 注册页面`);
            console.log(` http://localhost:${PORT}/login.html    - 登录页面`);
            console.log(` http://localhost:${PORT}/copy.html     - 主页面`);
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 启动服务器
startServer();

// 处理进程终止信号，关闭数据库连接
process.on('SIGINT', async () => {
    console.log('正在关闭服务器...');
    try {
        await db.end();
        console.log('数据库连接已关闭');
        process.exit(0);
    } catch (error) {
        console.error('关闭数据库连接失败:', error);
        process.exit(1);
    }
});

