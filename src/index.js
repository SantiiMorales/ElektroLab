const express = require('express');
const path = require('path');
const { SerialPort } = require('serialport');

const app = express();
const PORT = 1234;

// Configuración
app.use(express.static(path.join(__dirname, 'pages')));
app.use(express.json());

// Variables de estado
let puertoSerial = null;
let ultimoDato = "Dispositivo no conectado";

// Ruta para iniciar conexión con Arduino
app.post('/api/connect-arduino', async (req, res) => {
  try {
    // Cerrar conexión existente si hay una
    if (puertoSerial && puertoSerial.isOpen) {
      puertoSerial.close();
    }

    const ports = await SerialPort.list();
    const arduinoPort = ports.find(p => p.manufacturer?.includes('Arduino') || p.path.match(/COM[0-9]+/));

    if (!arduinoPort) {
      return res.status(404).json({ error: "Arduino no encontrado" });
    }

    puertoSerial = new SerialPort({
      path: arduinoPort.path,
      baudRate: 9600
    });

    puertoSerial.on('open', () => {
      console.log(`Conectado a ${arduinoPort.path}`);
      ultimoDato = "Conectado, esperando datos...";
    });

    puertoSerial.on('data', data => {
      ultimoDato = data.toString().trim();
    });

    puertoSerial.on('error', err => {
      console.error('Error:', err);
      ultimoDato = "Error de conexión";
    });

    puertoSerial.on('close', () => {
      ultimoDato = "Conexión cerrada";
    });

    res.json({ status: "Conectando", port: arduinoPort.path });

  } catch (err) {
    console.error('Error al conectar:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ruta para obtener datos
app.get('/api/serial-data', (req, res) => {
  res.json({ 
    data: ultimoDato,
    status: puertoSerial?.isOpen ? "conectado" : "desconectado"
  });
});

// Rutas principales
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/resistance', (req, res) => res.sendFile(path.join(__dirname, 'pages/resistance.html')));
app.get('/simulator', (req, res) => res.sendFile(path.join(__dirname, 'pages/simulator.html')));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('El servidor está activo, Arduino se conectará bajo demanda');
});