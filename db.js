const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'TU_CONTRASEÑA_DE_MYSQL',
  database: 'sgtv_db'
});

connection.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos sgtv_db');
});

module.exports = connection;