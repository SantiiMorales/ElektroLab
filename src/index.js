const express = require('express');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const PORT = 1234;

// Configuración
app.use(express.static(path.join(__dirname, 'pages')));
app.use(express.json());

let puertoSerial = null;
let resistenciaActual = 0;
let tolerancia = 5;

// Función para conectar al Arduino
async function conectarArduino() {
  try {
    const ports = await SerialPort.list();
    const arduinoPort = ports.find(p => p.manufacturer?.includes('Arduino') || p.path.match(/COM[0-9]+/));

    if (!arduinoPort) {
      console.log('Arduino no encontrado');
      return false;
    }

    puertoSerial = new SerialPort({
      path: arduinoPort.path,
      baudRate: 9600
    });

    const parser = puertoSerial.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    parser.on('data', data => {
      const valor = parseFloat(data.trim());
      if (!isNaN(valor)) {
        resistenciaActual = valor;
        console.log('Resistencia recibida:', resistenciaActual);
      }
    });

    puertoSerial.on('error', err => {
      console.error('Error en puerto serial:', err);
    });

    return true;
  } catch (err) {
    console.error('Error al conectar:', err);
    return false;
  }
}

// Ruta para obtener el valor actual
app.get('/api/resistencia', (req, res) => {
  res.json({
    resistencia: resistenciaActual,
    tolerancia: tolerancia
  });
});

// Ruta para conectar/desconectar Arduino
app.post('/api/conectar', async (req, res) => {
  if (puertoSerial?.isOpen) {
    puertoSerial.close();
    res.json({ status: 'desconectado' });
  } else {
    const exito = await conectarArduino();
    res.json({ status: exito ? 'conectado' : 'error' });
  }
});

// Ruta para cambiar tolerancia
app.post('/api/tolerancia', (req, res) => {
  const { valor } = req.body;
  tolerancia = parseInt(valor) || 5;
  res.json({ tolerancia });
});

// Rutas principales
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/resistance', (req, res) => res.sendFile(path.join(__dirname, 'pages/resistance.html')));
app.get('/simulator', (req, res) => res.sendFile(path.join(__dirname, 'pages/simulator.html')));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('El servidor está listo. Conecta Arduino desde la interfaz web.');
});