// Colores para las bandas de 5 bandas
const coloresDigito = {
    0: "black",       // Negro
    1: "#5b2800",     // Marrón
    2: "red",         // Rojo
    3: "orange",      // Naranja
    4: "yellow",      // Amarillo
    5: "green",       // Verde
    6: "blue",        // Azul
    7: "purple",      // Violeta
    8: "gray",        // Gris
    9: "white"        // Blanco
};

const coloresMultiplicador = {
    1: "black",       // ×1 Ω
    10: "#5b2800",    // ×10 Ω
    100: "red",       // ×100 Ω
    1000: "orange",   // ×1k Ω
    10000: "yellow",  // ×10k Ω
    100000: "green",  // ×100k Ω
    1000000: "blue",  // ×1M Ω
    10000000: "purple", // ×10M Ω
    0.1: "gold",      // ×0.1 Ω (Dorado)
    0.01: "silver"    // ×0.01 Ω (Plateado)
};

const coloresTolerancia = { 
    1: "#5b2800",     // Marrón (±1%)
    2: "red",         // Rojo (±2%)
    0.5: "green",     // Verde (±0.5%)
    0.25: "blue",     // Azul (±0.25%)
    0.1: "purple",    // Violeta (±0.1%)
    5: "gold",        // Dorado (±5%)
    10: "silver"      // Plateado (±10%)
};

// Variables de estado
let estaConectado = false;
let intervaloActualizacion = null;

// Función para resetear la resistencia a cero
function resetearResistencia() {
    // Mostrar 0Ω
    document.getElementById('resistencia-display').textContent = '0 Ω';
    
    // Poner todas las bandas en negro
    document.getElementById('banda1').style.backgroundColor = 'black';
    document.getElementById('banda2').style.backgroundColor = 'black';
    document.getElementById('banda3').style.backgroundColor = 'black';
    document.getElementById('banda4').style.backgroundColor = 'black';
    document.getElementById('banda5').style.backgroundColor = 'black';
    
    // Fondo verde (color inicial)
    document.body.style.backgroundColor = '#2ecc71';
}

// Función para descomponer la resistencia en 5 bandas
function descomponerResistencia(resistencia) {
    if (resistencia === 0) return { d1: 0, d2: 0, d3: 0, mult: 0, tol: 5 };
    
    // Determinar el multiplicador apropiado
    let exponente = Math.floor(Math.log10(resistencia));
    let mult;
    
    // Ajuste para valores menores a 1Ω
    if (resistencia < 1) {
        if (resistencia < 0.1) {
            mult = 0.01; // Plateado (×0.01)
        } else {
            mult = 0.1;  // Dorado (×0.1)
        }
        exponente = 0; // Ajuste para el cálculo de dígitos
    } else {
        mult = Math.pow(10, exponente - 2); // -2 porque tenemos 3 dígitos
    }
    
    // Calcular los 3 dígitos significativos
    const valorNormalizado = resistencia / mult;
    const d1 = Math.floor(valorNormalizado / 100);
    const d2 = Math.floor((valorNormalizado % 100) / 10);
    const d3 = Math.floor(valorNormalizado % 10);
    
    return {
        d1: d1,
        d2: d2,
        d3: d3,
        mult: mult,
        tol: document.getElementById('tolerancia-select').value
    };
}

// Función para actualizar la interfaz
function actualizarInterfaz(resistencia, tolerancia) {
    // Actualizar valor numérico
    const display = document.getElementById('resistencia-display');
    display.textContent = resistencia >= 1000 
        ? `${(resistencia/1000).toFixed(2)} kΩ` 
        : `${resistencia.toFixed(2)} Ω`;
    
    // Calcular bandas
    const bandas = descomponerResistencia(resistencia);
    
    // Aplicar colores a las bandas
    document.getElementById('banda1').style.backgroundColor = coloresDigito[bandas.d1];
    document.getElementById('banda2').style.backgroundColor = coloresDigito[bandas.d2];
    document.getElementById('banda3').style.backgroundColor = coloresDigito[bandas.d3];
    
    // Para el multiplicador (banda 4)
    let colorMultiplicador;
    if (bandas.mult === 0.01) colorMultiplicador = "silver";
    else if (bandas.mult === 0.1) colorMultiplicador = "gold";
    else colorMultiplicador = coloresMultiplicador[bandas.mult] || "black";
    
    document.getElementById('banda4').style.backgroundColor = colorMultiplicador;
    
    // Tolerancia (banda 5)
    document.getElementById('banda5').style.backgroundColor = coloresTolerancia[bandas.tol];
    
    // Cambiar color de fondo según el valor
    const body = document.body;
    if (resistencia < 1) {
        body.style.backgroundColor = '#e74c3c'; // Rojo para valores <1Ω
    } else if (resistencia < 10) {
        body.style.backgroundColor = '#f39c12'; // Naranja
    } else if (resistencia < 100) {
        body.style.backgroundColor = '#f1c40f'; // Amarillo
    } else if (resistencia < 1000) {
        body.style.backgroundColor = '#2ecc71'; // Verde
    } else if (resistencia < 10000) {
        body.style.backgroundColor = '#3498db'; // Azul
    } else {
        body.style.backgroundColor = '#9b59b6'; // Violeta para valores altos
    }
}

// Obtener datos del servidor
async function obtenerDatos() {
    try {
        const response = await fetch('/api/resistencia');
        const data = await response.json();
        actualizarInterfaz(data.resistencia, data.tolerancia);
    } catch (error) {
        console.error('Error al obtener datos:', error);
    }
}

// Función para manejar conexión/desconexión
async function toggleConexionArduino() {
    const boton = document.getElementById('conectar-btn');
    boton.disabled = true; // Deshabilitar botón durante la operación
    
    try {
        if (estaConectado) {
            // Proceso de desconexión
            const response = await fetch('/api/desconectar', {
                method: 'POST'
            });
            
            estaConectado = false;
            boton.textContent = 'Conectar Arduino';
            boton.style.backgroundColor = '#29ab60';
            
            // 1. Detener actualizaciones
            if (intervaloActualizacion) {
                clearInterval(intervaloActualizacion);
                intervaloActualizacion = null;
            }
            
            // 2. Resetear la resistencia a cero
            resetearResistencia();
            
        } else {
            // Proceso de conexión
            const response = await fetch('/api/conectar', {
                method: 'POST'
            });
            
            estaConectado = true;
            boton.textContent = 'Desconectar Arduino';
            boton.style.backgroundColor = '#e74c3c';
            
            // Hacer primera lectura inmediata
            await obtenerDatos();
            
            // Iniciar actualizaciones periódicas (cada 500ms)
            intervaloActualizacion = setInterval(obtenerDatos, 500);
        }
    } catch (error) {
        console.error('Error en la conexión:', error);
        alert('Error: ' + error.message);
    } finally {
        boton.disabled = false;
    }
}

// Configuración inicial al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Configurar eventos
    document.getElementById('conectar-btn').addEventListener('click', toggleConexionArduino);
    
    document.getElementById('tolerancia-select').addEventListener('change', async () => {
        if (estaConectado) {
            try {
                const tolerancia = document.getElementById('tolerancia-select').value;
                await fetch('/api/tolerancia', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ valor: tolerancia })
                });
                await obtenerDatos();
            } catch (error) {
                console.error('Error al cambiar tolerancia:', error);
            }
        }
    });
    
    document.getElementById('ayuda-btn').addEventListener('click', () => {
        alert("Este medidor muestra resistencias de 5 bandas:\n\n" +
              "1-3: Dígitos significativos\n" +
              "4: Multiplicador\n" +
              "5: Tolerancia\n\n" +
              "Presiona 'Conectar Arduino' para iniciar las mediciones.");
    });
    
    // Iniciar con resistencia en cero
    resetearResistencia();
});