// db.js - Railway环境的数据库连接配置
const mysql = require('mysql2/promise'); // 支持MySQL
const { Pool } = require('pg'); // 支持PostgreSQL

// 默认数据库配置
let dbConfig = {};
let dbType = 'mysql'; // 默认为MySQL

// 尝试从环境变量中获取数据库连接信息
// Railway通常通过DATABASE_URL环境变量提供数据库连接
if (process.env.DATABASE_URL) {
    // 解析Railway提供的DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    
    // 判断数据库类型
    if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
        dbType = 'postgres';
        
        // PostgreSQL配置
        dbConfig = {
            connectionString: databaseUrl,
            // 启用SSL，但允许非SSL连接（开发环境）
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : false,
            // 连接池配置
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 20000
        };
    } else if (databaseUrl.startsWith('mysql://')) {
        // MySQL URL解析
        dbType = 'mysql';
        const url = new URL(databaseUrl);
        
        dbConfig = {
            host: url.hostname,
            user: url.username,
            password: url.password,
            database: url.pathname.slice(1),
            port: url.port || 3306,
            // 连接池配置
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            // 启用SSL
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : false
        };
    }
} else {
    // 备用配置 - 从其他环境变量中获取
    if (process.env.DB_TYPE) {
        dbType = process.env.DB_TYPE;
    }
    
    if (dbType === 'postgres') {
        dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'piano_system',
            port: process.env.DB_PORT || 5432,
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : false
        };
    } else {
        // MySQL配置
        dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'piano_system',
            port: process.env.DB_PORT || 3306
        };
    }
}

// 创建数据库连接池
let db;

if (dbType === 'postgres') {
    // PostgreSQL连接池
    db = new Pool(dbConfig);
} else {
    // MySQL连接池
    db = mysql.createPool(dbConfig);
}

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} 连接是否成功
 */
async function testConnection() {
    let connection;
    try {
        if (dbType === 'postgres') {
            connection = await db.connect();
            await connection.query('SELECT NOW()');
        } else {
            connection = await db.getConnection();
            await connection.execute('SELECT NOW()');
        }
        console.log(`数据库连接成功！数据库类型: ${dbType}`);
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error.message);
        return false;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * 初始化数据库表（如果不存在）
 */
async function initializeDatabase() {
    try {
        if (dbType === 'postgres') {
            // PostgreSQL表创建
            await db.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(9) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } else {
            // MySQL表创建
            await db.execute(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(9) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
        }
        console.log('数据库表初始化完成');
    } catch (error) {
        console.error('数据库表初始化失败:', error.message);
    }
}

// 自动重试连接的函数
async function connectWithRetry(maxRetries = 5, delay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
        const success = await testConnection();
        if (success) {
            await initializeDatabase();
            return true;
        }
        console.log(`连接失败，${delay}ms后重试... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // 指数退避
        delay *= 1.5;
    }
    console.error(`在${maxRetries}次尝试后仍无法连接到数据库`);
    return false;
}

// 导出数据库连接和辅助函数
module.exports = {
    db,
    dbType,
    testConnection,
    initializeDatabase,
    connectWithRetry,
    // 包装常用的查询方法，添加错误处理
    async query(sql, params) {
        try {
            if (dbType === 'postgres') {
                return await db.query(sql, params);
            } else {
                return await db.execute(sql, params);
            }
        } catch (error) {
            console.error('数据库查询错误:', error.message);
            throw error;
        }
    },
    // 关闭数据库连接
    async close() {
        try {
            if (dbType === 'postgres') {
                await db.end();
            } else {
                await db.end();
            }
            console.log('数据库连接已关闭');
        } catch (error) {
            console.error('关闭数据库连接失败:', error.message);
        }
    }
};

console.log(`数据库配置已加载 (${dbType})`);