const express = require('express');
const path = require('path');
// const { SerialPort } = require('serialport');

const app = express();
const PORT = 1234;

// Configuración de middlewares
app.use(express.json());

// Configuración de archivos estáticos PARA DESARROLLO (sin cache)
app.use(express.static(path.join(__dirname), { 
  cacheControl: false,
  etag: false,
  lastModified: false
}));

app.use(express.static(path.join(__dirname, 'pages'), {
  cacheControl: false,
  etag: false,
  lastModified: false
}));

app.use(express.static(path.join(__dirname, 'public'), {
  cacheControl: false,
  etag: false,
  lastModified: false
}));

// Middleware adicional para prevenir caché en desarrollo
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// ... (el resto de tu código de SerialPort se mantiene igual)

// Rutas principales
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/resistance', (req, res) => res.sendFile(path.join(__dirname, 'pages/resistance.html')));
app.get('/simulator', (req, res) => res.sendFile(path.join(__dirname, 'pages/simulator.html')));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});