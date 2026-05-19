const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Consulta con JOIN para traer los nombres reales
    const query = `
        SELECT u.*, p.Nombre as nombre_perfil, d.Nombre as nombre_depto 
        FROM Usuario u
        JOIN Perfil p ON u.idPerfil = p.idPerfil
        JOIN Departamento d ON u.idDepartamento = d.idDepartamento
        WHERE u.email = ? AND u.contraseña = ?`;

    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        if (results.length > 0) {
            const user = results[0];
            delete user.contraseña;
            res.json({ success: true, user }); // Ahora 'user' lleva nombre_perfil y nombre_depto
        } else {
            res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    });
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});