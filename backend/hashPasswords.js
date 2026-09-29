// hashPasswords.js
require('dotenv').config({ path: './process.env' });
const bcrypt = require('bcrypt');
const db = require('./db');

const hashAndUpdate = async () => {
  try {
    const [rows] = await db.promise().query('SELECT idUsuario, contraseña FROM `usuario`');
    for (const user of rows) {
      // Si la contraseña no parece estar hasheada (ej: empieza con $2b$)
      if (!user.contraseña.startsWith('$2b$')) {
        const hashed = await bcrypt.hash(user.contraseña, 10);
        await db.promise().query('UPDATE `usuario` SET contraseña = ? WHERE idUsuario = ?', [hashed, user.idUsuario]);
        console.log(`Usuario ${user.idUsuario} actualizado.`);
      }
    }
    console.log('Proceso completado.');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

hashAndUpdate();