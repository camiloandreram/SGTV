// hashPasswords.js
require('dotenv').config({ path: './process.env' });  // Asegura la ruta
const bcrypt = require('bcrypt');
const db = require('./db');

// Resto del código sin cambios...

const hashAndUpdate = async () => {
  try {
    const [rows] = await db.promise().query('SELECT idUsuario, contraseña FROM Usuario');
    for (const user of rows) {
      // Si la contraseña no parece estar hasheada (ej: empieza con $2b$)
      if (!user.contraseña.startsWith('$2b$')) {
        const hashed = await bcrypt.hash(user.contraseña, 10);
        await db.promise().query('UPDATE Usuario SET contraseña = ? WHERE idUsuario = ?', [hashed, user.idUsuario]);
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