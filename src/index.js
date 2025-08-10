const express = require('express');
const path = require('path');
const { SerialPort } = require('serialport');

const app = express();
const PORT = 1234;

// Configuración
app.use(express.static(path.join(__dirname, '/pages')));
app.use(express.json());

let puertoSerial = null;
let ultimoDato = "Esperando conexión...";

// Función para conectar al puerto serial
async function conectarSerial() {
  try {
    const ports = await SerialPort.list();
    console.log('Puertos detectados:', ports.map(p => p.path));

    if (ports.length === 0) {
      console.log('No se detectaron puertos seriales. Conecta tu Arduino.');
      return;
    }

    // Buscar puerto que probablemente sea el Arduino
    const arduinoPort = ports.find(p => 
      p.manufacturer?.includes('Arduino') || 
      p.path.match(/COM[0-9]+/) // Asegurar formato COM + número
    );

    if (!arduinoPort) {
      console.log('No se encontró un puerto Arduino reconocido');
      return;
    }

    console.log(`Intentando conectar a: ${arduinoPort.path}`);

    puertoSerial = new SerialPort({
      path: arduinoPort.path,
      baudRate: 9600
    });

    puertoSerial.on('open', () => {
      console.log(`Conectado exitosamente a ${arduinoPort.path}`);
    });

    puertoSerial.on('data', data => {
      ultimoDato = data.toString().trim();
      console.log('Dato recibido:', ultimoDato);
    });

    puertoSerial.on('error', err => {
      console.error('Error en puerto serial:', err.message);
    });

    puertoSerial.on('close', () => {
      console.log('Puerto serial cerrado');
      // Intentar reconectar después de 5 segundos
      setTimeout(conectarSerial, 5000);
    });

  } catch (err) {
    console.error('Error al conectar:', err.message);
    setTimeout(conectarSerial, 5000); // Reintentar después de 5 segundos
  }
}

// Iniciar conexión serial al arrancar
conectarSerial();

// Ruta para obtener datos seriales
app.get('/api/serial-data', (req, res) => {
  res.json({ 
    data: ultimoDato,
    status: puertoSerial?.isOpen ? "conectado" : "desconectado"
  });
});

// Rutas principales
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/resistance', (req, res) => res.sendFile(__dirname + '/pages/resistance.html'));
app.get('/simulator', (req, res) => res.sendFile(__dirname + '/pages/simulator.html'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});