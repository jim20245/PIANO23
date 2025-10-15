// db.js
const mysql = require('mysql2/promise'); // 使用 Promise 接口

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'yourpassword',
  database: 'myapp',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;