let estaConectado = false;

async function actualizarDatos() {
  try {
    const response = await fetch('http://localhost:1234/api/serial-data');
    const { data, status } = await response.json();
    
    document.getElementById('data-display').textContent = data;
    
    // Actualizar estado de conexión
    if (status !== estaConectado) {
      estaConectado = status;
      document.getElementById('connection-status').textContent = 
        estaConectado ? "Conectado" : "Desconectado";
      document.getElementById('connection-status').className = 
        estaConectado ? "connected" : "disconnected";
    }
    
  } catch (error) {
    console.error("Error:", error);
    document.getElementById('connection-status').textContent = "Error de conexión";
  }
  
  setTimeout(actualizarDatos, 200); // Actualizar cada 200ms
}

// Iniciar cuando la página cargue
window.addEventListener('DOMContentLoaded', () => {
  // Agrega estos elementos a tu HTML si no los tienes
  const container = document.createElement('div');
  container.innerHTML = `
    <p>Estado: <span id="connection-status">Desconectado</span></p>
    <p>Valor: <span id="data-display">--</span></p>
  `;
  document.body.prepend(container);
  
  // Iniciar actualización de datos
  actualizarDatos();
});