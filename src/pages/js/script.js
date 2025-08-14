const canvas = document.getElementById('physicsCanvas');
const ctx = canvas.getContext('2d');
let cargas = [];
let cargaPositivaImg, cargaNegativaImg;

// Añade esta función en tu código (puede ir al principio del archivo)
function formatWithPrefix(value) {
    const prefixes = [
        { threshold: 1e9, prefix: 'G' },  // Giga
        { threshold: 1e6, prefix: 'M' },   // Mega
        { threshold: 1e3, prefix: 'k' },   // kilo
        { threshold: 1, prefix: '' },      // unidad
        { threshold: 1e-3, prefix: 'm' }, // mili
        { threshold: 1e-6, prefix: 'μ' }, // micro
        { threshold: 1e-9, prefix: 'n' }   // nano
    ];
    
    const absValue = Math.abs(value);
    if (absValue === 0) return '0';
    
    for (const { threshold, prefix } of prefixes) {
        if (absValue >= threshold) {
            const scaledValue = value / threshold;
            // Mostrar 2 decimales si el valor escalado es < 10
            const decimalPlaces = Math.abs(scaledValue) < 10 ? 2 : 1;
            return scaledValue.toFixed(decimalPlaces) + prefix;
        }
    }
    
    // Para valores muy pequeños, usar notación científica
    return value.toExponential(2);
}

function createForceComponentsArrow(coordinateSystem, carga, forceX, forceY) {
    // Eliminar flechas anteriores si existen
    document.getElementById('force-x-arrow')?.remove();
    document.getElementById('force-y-arrow')?.remove();
    document.getElementById('force-dashed-lines')?.remove();

    // Obtener coordenadas de inicio (posición de la carga)
    const startCoords = coordinateSystem.canvasCoords(carga.x, carga.y);
    
    // Calcular coordenadas de fin para componentes y resultante
    const scaleFactor = 1e8; // Mismo factor de escala que usas en createForceArrow
    const endCoords = coordinateSystem.canvasCoords(
        carga.x + forceX * scaleFactor,
        carga.y + forceY * scaleFactor
    );
    const endXCoords = coordinateSystem.canvasCoords(
        carga.x + forceX * scaleFactor,
        carga.y
    );
    const endYCoords = coordinateSystem.canvasCoords(
        carga.x,
        carga.y + forceY * scaleFactor
    );

    // Crear contenedor SVG (si no existe)
    let svg = document.getElementById('force-components-container');
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('id', 'force-components-container');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        coordinateSystem.canvas.parentElement.appendChild(svg);
    }

    // Definir marcadores de flecha (una vez)
    if (!document.getElementById('arrowhead-red')) {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        
        // Marcador rojo (componente X)
        const markerRed = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        markerRed.setAttribute('id', 'arrowhead-red');
        markerRed.setAttribute('markerWidth', '10');
        markerRed.setAttribute('markerHeight', '7');
        markerRed.setAttribute('refX', '9');
        markerRed.setAttribute('refY', '3.5');
        markerRed.setAttribute('orient', 'auto');
        const arrowHeadRed = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        arrowHeadRed.setAttribute('points', '0 0, 10 3.5, 0 7');
        arrowHeadRed.setAttribute('fill', 'red');
        markerRed.appendChild(arrowHeadRed);
        defs.appendChild(markerRed);

        // Marcador azul (componente Y)
        const markerBlue = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        markerBlue.setAttribute('id', 'arrowhead-blue');
        // ... (misma configuración pero con fill="blue")
        defs.appendChild(markerBlue);

        svg.appendChild(defs);
    }

    // Dibujar componente X (roja)
    const lineX = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineX.setAttribute('id', 'force-x-arrow');
    lineX.setAttribute('x1', startCoords[0]);
    lineX.setAttribute('y1', startCoords[1]);
    lineX.setAttribute('x2', endXCoords[0]);
    lineX.setAttribute('y2', endXCoords[1]);
    lineX.setAttribute('stroke', 'red');
    lineX.setAttribute('stroke-width', '2');
    lineX.setAttribute('marker-end', 'url(#arrowhead-red)');
    svg.appendChild(lineX);

    // Dibujar componente Y (azul)
    const lineY = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineY.setAttribute('id', 'force-y-arrow');
    // ... (similar a lineX pero con coordenadas Y y color azul)
    svg.appendChild(lineY);

    // Dibujar líneas punteadas auxiliares
    const dashedLines = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dashedLines.setAttribute('id', 'force-dashed-lines');
    
    const lineDash1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineDash1.setAttribute('x1', endXCoords[0]);
    lineDash1.setAttribute('y1', endXCoords[1]);
    lineDash1.setAttribute('x2', endCoords[0]);
    lineDash1.setAttribute('y2', endCoords[1]);
    lineDash1.setAttribute('stroke', 'gray');
    lineDash1.setAttribute('stroke-width', '1');
    lineDash1.setAttribute('stroke-dasharray', '5,3');
    
    const lineDash2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    // ... (similar para la otra línea punteada)
    
    dashedLines.appendChild(lineDash1);
    dashedLines.appendChild(lineDash2);
    svg.appendChild(dashedLines);

    // Actualizar al hacer zoom/pan (igual que en tu función original)
    coordinateSystem.canvas.addEventListener('redraw', function() {
        const newStart = coordinateSystem.canvasCoords(carga.x, carga.y);
        const newEndX = coordinateSystem.canvasCoords(
            carga.x + forceX * scaleFactor,
            carga.y
        );
        // ... (actualizar todas las coordenadas)
    });
}

function Matrix(entries) {
        this.entries = entries
        this.rows = this.entries.length
        this.cols = this.entries[0].length

        this.multiply = function (a) {
          let new_entries = []

          for (let i = 0; i < this.rows; i++) {
            new_entries.push([])
            for (let j = 0; j < a.cols; j++) {
              new_entries[i].push(0)
              for (let k = 0; k < this.cols; k++) {
                new_entries[i][j] += this.entries[i][k] * a.entries[k][j]
              }
            }
          }

          return new Matrix(new_entries)
        }

        this.add = function (a) {
          if (this.cols !== a.cols || this.rows !== a.rows) {
            throw 'Incompatible sizes'
          }

          let new_entries = []

          for (let i = 0; i < this.rows; i++) {
            new_entries.push([])
            for (let j = 0; j < a.cols; j++) {
              new_entries[i].push(this.entries[i][j] + a.entries[i][j])
            }
          }

          return new Matrix(new_entries)
        }

        this.scale = function (k) {
          let new_entries = []

          for (let i = 0; i < this.rows; i++) {
            new_entries.push([])
            for (let j = 0; j < this.cols; j++) {
              new_entries[i].push(k * this.entries[i][j])
            }
          }
          return new Matrix(new_entries)
        }

        this.subtract = function (a) {
          return this.add(a.scale(-1))
        }

        this.entry = function (i, j) {
          return this.entries[i][j]
        }

        this.determinant = function () {
          return (
            this.entries[0][0] * this.entries[1][1] -
            this.entries[0][1] * this.entries[1][0]
          )
        }

        this.inverse = function () {
          if (this.cols !== 2 || this.rows !== 2) {
            throw 'Incompatible size'
          }

          let det = this.determinant()
          if (det === 0) {
            throw 'Matrix is not invertible'
          }

          let new_entries = [
            [this.entries[1][1], -this.entries[0][1]],
            [-this.entries[1][0], this.entries[0][0]],
          ]

          return new Matrix(new_entries).scale(1 / det)
        }

        this.toString = function () {
          let o = ''
          for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
              o += this.entries[i][j] + ' '
            }

            if (i + 1 < this.rows) {
              o += '\n'
            }
          }
          return o
        }
      }

//Clase para crear una carga
class Carga {
  constructor(x, y, valor, id){
    this._x = x;
    this._y = y;
    this.valor = valor;
    this.id = id;
    this.focused = false;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  set x(_x){
    this._x = _x;
  }

  set y(_y){
    this._y = _y;
  }

  calculateDistance(_x, _y){
    return Math.sqrt((Math.pow(this._x - _x, 2) + Math.pow(this._y - _y, 2)));
  }
}

//Función para calcular la magnitud de la fuerza
function calculateForce(carga1, carga2, dist){
  const k = 9e9;

  const forceMagnitude = (k * carga1.valor * carga2.valor)/ Math.pow(dist, 2);

  return forceMagnitude;
}

//Función para calcular el campo eléctrico de manera vectorial
function vectorialCamp(c, x, y){
  i = c * (x/(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))));
  j = c * y/(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
  return [i, j];
}

//Función para calcular la fuerza de manera vectorial
function vectorialForce(force, x, y){
  i = force * (x/(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))));
  j = force * y/(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
  return [i, j];
}

function selectedCharge(cargaObjects, selectedCarga, _this) {
    let force = 0, x = 0, y = 0, i = 0, j = 0, cI = 0, cJ = 0;
    cargaObjects.forEach(carga => {
        if (carga !== selectedCarga) {
            const dist = carga.calculateDistance(selectedCarga.x, selectedCarga.y);
            let forceLocal = calculateForce(selectedCarga, carga, dist);
            let campLocal = forceLocal / selectedCarga.valor;
            x = carga.x - selectedCarga.x;
            y = carga.y - selectedCarga.y;
            
            let [iLocal, jLocal] = vectorialForce(forceLocal, x, y);
            let [c1, c2] = vectorialCamp(campLocal, x, y);

            if(selectedCarga.valor > 0){
              iLocal *= -1;
              jLocal *= -1;
              c1 *= -1;
              c2 *= -1;
            }

            i += iLocal;
            j += jLocal;
            cI += c1;
            cJ += c2;
        }
    });

    // Actualizar información en el div
    let infoDiv = document.getElementById('info');
    const epsilon = 1e-8;
    infoDiv.innerHTML = `
        <span class="info-span">Carga evaluada: Carga ${selectedCarga.id}</span>
        <span class="info-span">
            F = 
            ${formatWithPrefix(i)}i
            ${formatWithPrefix(j)}j N
        </span>
        <span class="info-span">
            E =  
            ${formatWithPrefix(cI)}i 
            ${formatWithPrefix(cJ)}j N/C
        </span>
    `;

    infoDiv.style.display = 'flex';

    // Guardar datos de todas las flechas (resultante y componentes)
    _this.arrowData = {
        start: { x: selectedCarga.x, y: selectedCarga.y },
        end: { 
            x: selectedCarga.x + toScientificNotation(cI), 
            y: selectedCarga.y + toScientificNotation(cJ) 
        },
        components: {
            x: { 
                x: selectedCarga.x + toScientificNotation(cI), 
                y: selectedCarga.y 
            },
            y: { 
                x: selectedCarga.x, 
                y: selectedCarga.y + toScientificNotation(cJ) 
            }
        }
    };
    
    _this.draw(); // Redibujar todo, incluyendo las flechas
}

function createForceArrow(coordinateSystem, carga, forceX, forceY) {
    // Eliminar flecha anterior si existe
    const existingArrow = document.getElementById('force-arrow');
    if (existingArrow) {
        existingArrow.remove();
    }
    
    // Obtener coordenadas de inicio (posición de la carga)
    const startCoords = coordinateSystem.canvasCoords(carga.x, carga.y);
    
    // Calcular coordenadas de fin (posición + fuerza)
    const scaleFactor = 1e8; // Factor de escala para hacer visible la fuerza
    const endCoords = coordinateSystem.canvasCoords(
        carga.x + forceX * scaleFactor,
        carga.y + forceY * scaleFactor
    );
    
    // Crear elemento SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('id', 'force-arrow');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none'; // Para que no interfiera con los clicks
    
    // Crear línea de la flecha
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute('x1', startCoords[0]);
    line.setAttribute('y1', startCoords[1]);
    line.setAttribute('x2', endCoords[0]);
    line.setAttribute('y2', endCoords[1]);
    line.setAttribute('stroke', 'red');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    
    // Crear marcador para la punta de la flecha
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrowHead.setAttribute('points', '0 0, 10 3.5, 0 7');
    arrowHead.setAttribute('fill', 'red');
    
    marker.appendChild(arrowHead);
    defs.appendChild(marker);
    svg.appendChild(defs);
    svg.appendChild(line);
    
    // Insertar el SVG en el contenedor del canvas
    const container = coordinateSystem.canvas.parentElement;
    container.appendChild(svg);
    
    // Actualizar la flecha cuando se haga zoom o pan
    coordinateSystem.canvas.addEventListener('redraw', function() {
        const newStart = coordinateSystem.canvasCoords(carga.x, carga.y);
        const newEnd = coordinateSystem.canvasCoords(
            carga.x + forceX * scaleFactor,
            carga.y + forceY * scaleFactor
        );
        
        line.setAttribute('x1', newStart[0]);
        line.setAttribute('y1', newStart[1]);
        line.setAttribute('x2', newEnd[0]);
        line.setAttribute('y2', newEnd[1]);
    });
}

function toScientificNotation(num) {
    if (num === 0) return 0;

    const exponent = Math.floor(Math.log10(Math.abs(num)));
    const coefficient = num / Math.pow(10, exponent);
    
    return coefficient;
}

class CoordinateSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.svgContainer = document.createElement('div');
        this.svgContainer.style.position = 'absolute';
        this.svgContainer.style.top = '0';
        this.svgContainer.style.left = '0';
        this.svgContainer.style.width = this.canvas.width + 'px';
        this.svgContainer.style.height = this.canvas.height + 'px';
        this.svgContainer.style.pointerEvents = 'none';
        this.svgContainer.style.overflow = 'visible';
        this.canvas.parentElement.appendChild(this.svgContainer);
        this.settings = {
            gridLines: {
                major: {
                    spacing: 1,
                    color: '#555',
                    width: 0.5,
                },
                minor: {
                    spacing: 0.25,
                    color: '#777',
                    width: 0.25,
                },
            },
            backgroundColor: '#dadada',
            axes: {
                color: 'black',
                width: 2,
                labelColor: 'black',
            },
            border: {
                color: 'black',
                width: 5,
            },
        };

        this.zoomLevel = 1;
        this.zoomMatrix = new Matrix([
            [100, 0],
            [0, 100],
        ]);
        this.translation = new Matrix([[1], [1]]);

        // Variables para las cargas
        this.cargas = [];
        this.arrowData = null; // Guardar datos de flecha
        this.cargasObjects = [];
        this.arrows = [];
        this.cargaPositivaImg = new Image();
        this.cargaNegativaImg = new Image();
        this.loadChargeImages();
        this.angle = 0;

        // Eventos del mouse
        const mouseState = {
            pressed: false,
            prevPosistion: null,
        };

        this.canvas.addEventListener('mousedown', e => {
            mouseState.pressed = true;
        });

        

        //Evento para detectar cuando se hace clic en el canvas, y para detectar cuando se selecciona una carga
        this.canvas.addEventListener('click', (e) => {
          let selectedCarga;
          this.context.restore();
          if(!mouseState.pressed){
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top; 
            const [worldX, worldY] = this.fromCanvasCoords(mouseX, mouseY);
            if(this.cargasObjects.length > 1){
              this.cargasObjects.forEach(carga => {
                if(carga.x == Math.round(worldX) && carga.y == Math.round(worldY)){
                  selectedCarga = carga;
                  carga.focused = true;
                } else {
                  carga.focused = false;
                }
              });
            }

            if(selectedCarga){
                selectedCharge(this.cargasObjects, selectedCarga, this);
            }
          }
        });

        this.canvas.addEventListener('mouseup', e => {
            mouseState.pressed = false;
        });

        this.canvas.addEventListener('mouseleave', e => {
            mouseState.pressed = false;
        });

        this.canvas.addEventListener('mousemove', e => {
            this.context.restore();
            const x = e.offsetX;
            const y = e.offsetY;

            if (mouseState.pressed && mouseState.prevPosistion) {
              const currentPosition = this.fromCanvasCoords(x, y);
                const prevPosistion = this.fromCanvasCoords(
                    mouseState.prevPosistion[0],
                    mouseState.prevPosistion[1]
                );

                this.translate(
                    currentPosition[0] - prevPosistion[0],
                    currentPosition[1] - prevPosistion[1]
                );
            }
            mouseState.prevPosistion = [x, y];
        });

        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const x = e.offsetX;
            const y = e.offsetY;
            const zoomFactor = 0.001 * e.deltaY;
            this.zoom(zoomFactor, x, y);
        });

        this.draw();
    }

    drawArrow() {
      if (!this.arrowData) return;
      const { start, end, components } = this.arrowData;

      // Convertir coordenadas del mundo a canvas
      const startCoords = this.canvasCoords(start.x, start.y);
      const endCoords = this.canvasCoords(end.x, end.y);
      const xCompCoords = this.canvasCoords(components.x.x, components.x.y);
      const yCompCoords = this.canvasCoords(components.y.x, components.y.y);

      // Dibujar componentes primero (para que queden detrás de la resultante)
      this.drawSingleArrow(startCoords, xCompCoords, 'red'); // Componente X
      this.drawSingleArrow(startCoords, yCompCoords, 'blue'); // Componente Y
      
      // Dibujar líneas punteadas para el paralelogramo
      this.context.save();
      this.context.setLineDash([5, 3]);
      this.context.strokeStyle = 'gray';
      this.context.lineWidth = 1 / this.zoomLevel;
      
      // Línea desde componente X hasta resultante
      this.context.beginPath();
      this.context.moveTo(xCompCoords[0], xCompCoords[1]);
      this.context.lineTo(endCoords[0], endCoords[1]);
      this.context.stroke();
      
      // Línea desde componente Y hasta resultante
      this.context.beginPath();
      this.context.moveTo(yCompCoords[0], yCompCoords[1]);
      this.context.lineTo(endCoords[0], endCoords[1]);
      this.context.stroke();
      
      this.context.setLineDash([]);
      this.context.restore();
      
      // Dibujar resultante (verde) encima de todo
      this.drawSingleArrow(startCoords, endCoords, 'green');
  }

  drawSingleArrow(startCoords, endCoords, color) {
    if (!startCoords || !endCoords || startCoords.length < 2 || endCoords.length < 2) {
        console.error("Coordenadas inválidas para drawSingleArrow");
        return;
    }
    const arrowLength = 10 / this.zoomLevel;
    const arrowAngle = Math.PI / 6;
    const angle = Math.atan2(endCoords[1] - startCoords[1], endCoords[0] - startCoords[0]);

    this.context.save();
    
    // Línea principal
    this.context.beginPath();
    this.context.moveTo(startCoords[0], startCoords[1]);
    this.context.lineTo(endCoords[0], endCoords[1]);
    this.context.strokeStyle = color;
    this.context.lineWidth = 3 / this.zoomLevel;
    this.context.stroke();

    // Cabeza de flecha
    const x1 = endCoords[0] - arrowLength * Math.cos(angle + arrowAngle);
    const y1 = endCoords[1] - arrowLength * Math.sin(angle + arrowAngle);
    const x2 = endCoords[0] - arrowLength * Math.cos(angle - arrowAngle);
    const y2 = endCoords[1] - arrowLength * Math.sin(angle - arrowAngle);

    this.context.beginPath();
    this.context.moveTo(endCoords[0], endCoords[1]);
    this.context.lineTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.closePath();
    this.context.fillStyle = color;
    this.context.fill();
    
    this.context.restore();
}

    drawArrowSVG(startX, startY, endX, endY) {
      this.clearArrows();  
      /* 
        
        // Asegurarse de que las coordenadas son números válidos
        if (isNaN(startX)) startX = 0;
        if (isNaN(startY)) startY = 0;
        if (isNaN(endX)) endX = 0;
        if (isNaN(endY)) endY = 0;
        
        // Calcular la longitud del vector
        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        if (length < 5) return; // No dibujar flechas demasiado cortas
        
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = Math.min(15, length/3);
        
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', this.canvas.width);
        svg.setAttribute('height', this.canvas.height);
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        
        // Línea principal
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.setAttribute('stroke', 'green');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('stroke-linecap', 'round');
        
        // Cabeza de flecha
        const arrowHead = document.createElementNS(svgNS, 'path');
        const headLength = arrowLength;
        const headAngle = Math.PI/6;
        
        const x1 = endX - headLength * Math.cos(angle - headAngle);
        const y1 = endY - headLength * Math.sin(angle - headAngle);
        const x2 = endX - headLength * Math.cos(angle + headAngle);
        const y2 = endY - headLength * Math.sin(angle + headAngle);
        
        arrowHead.setAttribute('d', `M ${endX} ${endY} L ${x1} ${y1} L ${x2} ${y2} Z`);
        arrowHead.setAttribute('fill', 'green');
        
        svg.appendChild(line);
        svg.appendChild(arrowHead);
        this.svgContainer.appendChild(svg); */
        let arrowLength = 10;
        const arrowAngle = Math.PI / 6; // Ángulo de la punta (30 grados)

        const angle = Math.atan2(endY - startY, endX - startX);
        const x1 = endX - arrowLength * Math.cos(angle + arrowAngle);
        const y1 = endY - arrowLength * Math.sin(angle + arrowAngle);
        const x2 = endX - arrowLength * Math.cos(angle - arrowAngle);
        const y2 = endY - arrowLength * Math.sin(angle - arrowAngle);
        this.context.save();
        this.context.beginPath();
        this.context.moveTo(startX, startY);
        this.context.lineTo(endX, endY);
        this.context.strokeStyle = 'red';
        this.context.lineWidth = 4 / this.zoomLevel;
        this.context.closePath();
        this.context.stroke();
        this.context.beginPath();
        this.context.beginPath();
        this.context.moveTo(endX, endY);
        this.context.strokeStyle = 'red';
        this.context.lineTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.closePath();
        this.context.fillStyle = 'red';
        this.context.fill();
        this.context.restore();
    }

    clearArrows() {
      this.context.save();
      console.log("Limpiando flechas");
    }

    // Cargar imágenes de las cargas
    loadChargeImages() {
        // SVG para carga positiva (+)
        this.cargaPositivaImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path fill="red" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344V280H168c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H280v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/>
            </svg>
        `);
        
        // SVG para carga negativa (-)
        this.cargaNegativaImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path fill="blue" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM184 232H328c13.3 0 24 10.7 24 24s-10.7 24-24 24H184c-13.3 0-24-10.7-24-24s10.7-24 24-24z"/>
            </svg>
        `);
    }

    // Actualizar las cargas desde el formulario
    updateCargasFromForm() {
        this.cargas = [];
        this.arrowData = null; // Guardar datos de flecha
        this.cargasObjects = [];
        this.arrows = [];

        
        document.querySelectorAll('.carga-div').forEach((div, index) => {
            const valorInput = div.querySelector('input[type="number"]:not([id*="cordinate"])');
            const xInput = div.querySelector('input[id^="x-cordinate"]');
            const yInput = div.querySelector('input[id^="y-cordinate"]');
            
            this.cargas.push({
                valor: parseFloat(valorInput.value),
                x: parseFloat(xInput.value),
                y: parseFloat(yInput.value),
                id: index + 1
            });

            this.cargasObjects.push(new Carga(parseFloat(xInput.value), parseFloat(yInput.value), parseFloat(valorInput.value), index + 1));
            console.log(this.cargasObjects);
        });
        
    }

    // Dibujar las cargas en el canvas
    drawCargas() {
        if (!this.cargaPositivaImg.complete || !this.cargaNegativaImg.complete) return;

        this.cargas.forEach(carga => {
            const coords = this.canvasCoords(carga.x, carga.y);
            const x = coords[0];
            const y = coords[1];
            const size = 30 * (1 / this.zoomLevel); // Tamaño ajustado al zoom

            // Seleccionar imagen según el signo de la carga
            const img = carga.valor >= 0 ? this.cargaPositivaImg : this.cargaNegativaImg;
            
            // Dibujar icono SVG
            this.context.drawImage(img, x - size/2, y - size/2, size, size);

            // Dibujar etiqueta
            this.context.fillStyle = 'black';
            this.context.font = `${12 * (1 / this.zoomLevel)}px Arial`;
            this.context.textAlign = 'center';
            this.context.fillText(
                `Carga ${carga.id}`,
                x,
                y + size/2 + 15 * (1 / this.zoomLevel)
            );
        });
    }

        drawGridlines() {
          this.context.beginPath()
          const topLeft = this.fromCanvasCoords(0, 0)
          const bottomRight = this.fromCanvasCoords(
            this.canvas.width,
            this.canvas.height
          )

          for (const i in this.settings.gridLines) {
            this.context.strokeStyle = this.settings.gridLines[i].color
            this.context.lineWidth = this.settings.gridLines[i].width

            const spacing = this.settings.gridLines[i].spacing

            let startX = spacing * Math.ceil(topLeft[0] / spacing)
            let endX = spacing * Math.floor(bottomRight[0] / spacing)

            this.context.beginPath()

            for (let x = startX; x <= endX; x += spacing) {
              const coords = this.canvasCoords(x, 0)

              this.context.moveTo(coords[0], 0)
              this.context.lineTo(coords[0], this.canvas.height)
            }

            let endY = spacing * Math.ceil(topLeft[1] / spacing)
            let startY = spacing * Math.floor(bottomRight[1] / spacing)

            for (let y = startY; y <= endY; y += spacing) {
              const coords = this.canvasCoords(0, y)
              this.context.moveTo(0, coords[1])
              this.context.lineTo(this.canvas.width, coords[1])
            }

            this.context.stroke();
          }
        }

        drawAxes() {
          const origin = this.canvasCoords(0, 0)
          const x = origin[0]
          const y = origin[1]

          if (
            (x >= 0 && x <= this.canvas.width) ||
            (y >= 0 && y <= this.canvas.height)
          ) {
            this.context.beginPath()
            this.context.strokeStyle = this.settings.axes.color
            this.context.lineWidth = this.settings.axes.width
            this.context.moveTo(0, y)
            this.context.lineTo(this.canvas.width, y)
            this.context.moveTo(x, 0)
            this.context.lineTo(x, this.canvas.height)
            this.context.stroke()
          }
        }

        drawTickLabels() {
          this.context.fillStyle = this.settings.axes.labelColor
          this.context.font = '12px Arial'
          this.context.textAlign = 'center'
          this.context.textBaseline = 'middle'

          const topLeft = this.fromCanvasCoords(0, 0)
          const bottomRight = this.fromCanvasCoords(
            this.canvas.width,
            this.canvas.height
          )

          const spacing = this.settings.gridLines.major.spacing

          let startX = spacing * Math.ceil(topLeft[0] / spacing)
          let endX = spacing * Math.floor(bottomRight[0] / spacing)

          for (let x = startX; x <= endX; x += spacing) {
            const coords = this.canvasCoords(x, 0)
            this.context.fillText(
              this.formatLabel(x),
              coords[0],
              coords[1] - 10
            )
          }

          let endY = spacing * Math.ceil(topLeft[1] / spacing)
          let startY = spacing * Math.floor(bottomRight[1] / spacing)

          for (let y = startY; y <= endY; y += spacing) {
            const coords = this.canvasCoords(0, y)
            this.context.fillText(
              this.formatLabel(y),
              coords[0] + 10,
              coords[1]
            )
          }
        }

        formatLabel(num) {
          if (Math.abs(num) > 100000) {
            return num.toExponential(2)
          } else if (Number.isInteger(num)) {
            return num.toString()
          } else if (Math.abs(num) < 0.001) {
            return num.toExponential(2)
          } else {
            return num.toFixed(3)
          }
        }

        
    drawArrow() {
        if (!this.arrowData) return;
        const { start, end } = this.arrowData;

        const startCoords = this.canvasCoords(start.x, start.y);
        const endCoords = this.canvasCoords(end.x, end.y);

        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        const angle = Math.atan2(endCoords[1] - startCoords[1], endCoords[0] - startCoords[0]);

        this.context.save();
        this.context.beginPath();
        this.context.moveTo(startCoords[0], startCoords[1]);
        this.context.lineTo(endCoords[0], endCoords[1]);
        this.context.strokeStyle = 'red';
        this.context.lineWidth = 4 / this.zoomLevel;
        this.context.stroke();

        const x1 = endCoords[0] - arrowLength * Math.cos(angle + arrowAngle);
        const y1 = endCoords[1] - arrowLength * Math.sin(angle + arrowAngle);
        const x2 = endCoords[0] - arrowLength * Math.cos(angle - arrowAngle);
        const y2 = endCoords[1] - arrowLength * Math.sin(angle - arrowAngle);

        this.context.beginPath();
        this.context.moveTo(endCoords[0], endCoords[1]);
        this.context.lineTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.closePath();
        this.context.fillStyle = 'red';
        this.context.fill();
        this.context.restore();
    }

    draw() {
        this.context.fillStyle = this.settings.backgroundColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.strokeStyle = this.settings.border.color;
        this.context.lineWidth = this.settings.border.width;
        this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGridlines();
        this.drawAxes();
        this.drawTickLabels();
        this.drawCargas();
        this.drawArrow(); // Flecha persistente
    }


        canvasCoords(x, y) {
          const point = new Matrix([[x], [y]])
          const newPoint = this.zoomMatrix.multiply(point).add(this.translation)

          const coords = [newPoint.entry(0, 0), newPoint.entry(1, 0)]

          return [
            coords[0] + 0.5 * this.canvas.width,
            -coords[1] + 0.5 * this.canvas.height,
          ]
        }

        fromCanvasCoords(x, y) {
          x -= 0.5 * this.canvas.width
          y = -(y - 0.5 * this.canvas.height)

          const point = new Matrix([[x], [y]])
          const newPoint = this.zoomMatrix
            .inverse()
            .multiply(point.subtract(this.translation))
          return [newPoint.entry(0, 0), newPoint.entry(1, 0)]
        }

        translate(u, v) {
          const w = new Matrix([[u], [v]])
          const vector = this.zoomMatrix.multiply(w)
          this.translation = this.translation.add(vector)
          this.draw()
        }

        zoom(zoomFactor, mouseX, mouseY) {
          const worldCoords = this.fromCanvasCoords(mouseX, mouseY)
          const worldCoordsMatrix = new Matrix([
            [worldCoords[0]],
            [worldCoords[1]],
          ])
          const newZoom = this.zoomMatrix.scale(zoomFactor + 1)

          const zoomDifference = newZoom.subtract(this.zoomMatrix)

          this.translation = this.translation.subtract(
            zoomDifference.multiply(worldCoordsMatrix)
          )
          this.zoomMatrix = newZoom

          this.zoomLevel *= zoomFactor + 1
          if (this.zoomLevel >= 2 || this.zoomLevel <= 0.5) {
            const factor = this.zoomLevel >= 2 ? 0.5 : 2

            for (const i in this.settings.gridLines) {
              this.settings.gridLines[i].spacing *= factor
            }

            this.zoomLevel *= factor
          }

          this.draw()
        }
}

window.addEventListener('load', function() {
        const canvas = document.getElementById('physicsCanvas');
        const container = canvas.parentElement;
        
        function resizeCanvas() {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }
        
        // Inicializar y redimensionar cuando cambie el tamaño de la ventana
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Aquí iría el resto de tu código para el simulador
})

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("physicsCanvas");
    const grid = new CoordinateSystem(canvas);
    
    // Redimensionar canvas
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        grid.draw();
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Configurar eventos para el formulario de cargas
    const addChargeBtn = document.getElementById('addChargeBtn');
    const chargesContainer = document.getElementById('chargesContainer');
    let chargeCount = 1;

    addChargeBtn.addEventListener('click', function() {
        const newChargeDiv = document.createElement('div');
        newChargeDiv.className = 'carga-div';
        newChargeDiv.innerHTML = `
            <div class="carga-header">
                <span>Carga ${chargeCount} (C)</span>
                <div>
                    <i class="fas fa-minus minimizar" data-charge="${chargeCount}"></i>
                </div>
            </div>
            <div class="carga-content">
                <label for="charge${chargeCount}">Valor (C):</label>
                <input type="number" id="charge${chargeCount}" value="1e-6" step="1e-6">
                <label for="x-cordinate${chargeCount}">X:</label>
                <input type="number" id="x-cordinate${chargeCount}" value="0" step="1">
                <label for="y-cordinate${chargeCount}">Y:</label>
                <input type="number" id="y-cordinate${chargeCount}" value="0" step="1">
                <button class="remove-charge-btn" data-charge="${chargeCount}">Eliminar</button>
            </div>
        `;
        
        chargesContainer.appendChild(newChargeDiv);
        chargeCount++;
        
        // Actualizar y redibujar
        grid.updateCargasFromForm();
        grid.draw();
    });

    // Delegación de eventos para el contenedor de cargas
    chargesContainer.addEventListener('click', function(e) {
        const target = e.target;
        
        // Manejar minimizar
        if (target.classList.contains('minimizar')) {
            const cargaDiv = target.closest('.carga-div');
            cargaDiv.classList.toggle('carga-minimizada');
            
            // Cambiar icono
            if (cargaDiv.classList.contains('carga-minimizada')) {
                target.classList.replace('fa-minus', 'fa-plus');
            } else {
                target.classList.replace('fa-plus', 'fa-minus');
            }
        }
        
        // Manejar eliminar
        if (target.classList.contains('remove-charge-btn')) {
            if (confirm('¿Estás seguro de eliminar esta carga?')) {
                target.closest('.carga-div').remove();
                updateChargeNumbers();
                grid.updateCargasFromForm();
                grid.draw();
            }
        }
    });

    // Actualizar cuando se modifique cualquier input
    document.addEventListener('input', function(e) {
        if (e.target.matches('.carga-div input')) {
            grid.updateCargasFromForm();
            grid.draw();
        }
    });

    // Función para actualizar números de carga
    function updateChargeNumbers() {
        const chargeDivs = document.querySelectorAll('.carga-div');
        chargeDivs.forEach((div, index) => {
            const chargeNumber = index + 1;
            div.querySelector('.carga-header span').textContent = `Carga ${chargeNumber} (C)`;
        });
    }
});