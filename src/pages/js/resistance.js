document.addEventListener('DOMContentLoaded', () => {
    // 1. Selección segura de elementos con verificación
    const connectButton = document.getElementById('connect-button');
    const statusDisplay = document.getElementById('connection-status');
    const dataDisplay = document.getElementById('data-display');
    
    // 2. Verifica que los elementos existan antes de usarlos
    if (!connectButton || !statusDisplay || !dataDisplay) {
        console.error('Error: No se encontraron todos los elementos necesarios en el DOM');
        return;
    }
    
    // 3. Estado de la aplicación
    let estaConectado = false;
    let puertoSerial = null;
    
    // 4. Función para actualizar datos
    async function actualizarDatos() {
        try {
            const response = await fetch('/api/serial-data');
            const { data, status } = await response.json();
            
            if (dataDisplay) dataDisplay.textContent = data;
            
            if (status !== estaConectado && statusDisplay) {
                estaConectado = status;
                statusDisplay.textContent = estaConectado ? "Conectado" : "Desconectado";
                statusDisplay.className = estaConectado ? "connected" : "disconnected";
            }
        } catch (error) {
            console.error("Error al obtener datos:", error);
            if (statusDisplay) statusDisplay.textContent = "Error de conexión";
        }
        
        setTimeout(actualizarDatos, 200);
    }
    
    // 5. Manejador del botón (con verificación adicional)
    connectButton.addEventListener('click', async () => {
        console.log("Intentando conectar Arduino...");
        
        try {
            const response = await fetch('/api/connect-arduino', {
                method: 'POST'
            });
            
            const result = await response.json();
            console.log("Resultado:", result);
            
            if (!response.ok) {
                throw new Error(result.error || "Error desconocido");
            }
            
            alert("Conexión establecida correctamente");
        } catch (error) {
            console.error("Error de conexión:", error);
            alert(`Error al conectar: ${error.message}`);
        }
    });
    
    // 6. Iniciar la actualización de datos
    actualizarDatos();
});