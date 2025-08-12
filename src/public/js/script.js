const canvas = document.getElementById('physicsCanvas');
const ctx = canvas.getContext('2d');
let cargas = [];
let cargaPositivaImg, cargaNegativaImg;


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

function selectedCharge(cargaObjects, selectedCarga, _this){
    let force = 0, x = 0, y = 0, i = 0, j = 0, cI = 0, cJ = 0;
    cargaObjects.forEach(carga => {
      if (carga !== selectedCarga) {
        const dist = carga.calculateDistance(selectedCarga.x, selectedCarga.y);
        console.log(`Distancia de ${selectedCarga.id} a ${carga.id}: ${dist.toFixed(2)}`);

        //Cálculo de la fuerza y el campo eléctrico
        let forceLocal = calculateForce(selectedCarga, carga, dist);
        let campLocal = forceLocal / selectedCarga.valor;
        console.log(`Fuerza entre las cargas ${selectedCarga.id} y ${carga.id}: ${forceLocal} N`);
        x = carga.x - selectedCarga.x;
        y = carga.y - selectedCarga.y;
        
        force += forceLocal;
        console.log("Valores: ");
        console.log(x, y);

        let [iLocal, jLocal] = vectorialForce(forceLocal, x, y);
        let [c1, c2] = vectorialCamp(campLocal, x, y);

        iLocal *= -1;
        jLocal *= -1;
        c1 *= -1;
        console.log('C2:', c2);
        c2 *= -1;

        i += iLocal;
        j += jLocal;

        cI += c1;
        cJ += c2;

        console.log(`Componente de la fuerza en i: ${iLocal.toFixed(8)} N`);
        console.log(`Componente de la fuerza en j: ${jLocal.toFixed(8)} N`);
        console.log(`Componente del campo en i: ${c1.toFixed(8)} N/C`);
        console.log(`Componente del campo en j: ${c2.toFixed(8)} N/C`);
      }
    });


    let infoDiv = document.getElementById('info');

    const epsilon = 1e-8;

    infoDiv.innerHTML = `
      <span class="info-span">Carga evaluada: Carga ${selectedCarga.id}</span>
      <span class="info-span">
        F = 
        ${Math.abs(i) < epsilon ? 0 : i.toFixed(5)}i
        ${Math.abs(j) < epsilon ? 0 : j.toFixed(5)}j N
      </span>
      <span class="info-span">
        E =  
        ${Math.abs(cI) < epsilon ? 0 : cI.toFixed(5)}i 
        ${Math.abs(cJ) < epsilon ? 0 : cJ.toFixed(5)}j N/C
      </span>
    `;

    console.log(toScientificNotation(cI));
    console.log(toScientificNotation(cJ));

    const startCoords = _this.canvasCoords(selectedCarga.x, selectedCarga.y);
    const endCoords = _this.canvasCoords(
        selectedCarga.x + toScientificNotation(cI), // Multiplicar por factor para hacer visible
        selectedCarga.y + toScientificNotation(cJ)
    );

    let arrowLength = 10;

    [startX, startY] = startCoords;
    [endX, endY] = endCoords;

    const arrowAngle = Math.PI / 6; // Ángulo de la punta (30 grados)

    const angle = Math.atan2(endY - startY, endX - startX);
    const x1 = endX - arrowLength * Math.cos(angle + arrowAngle);
    const y1 = endY - arrowLength * Math.sin(angle + arrowAngle);
    const x2 = endX - arrowLength * Math.cos(angle - arrowAngle);
    const y2 = endY - arrowLength * Math.sin(angle - arrowAngle);
    _this.context.save();
    _this.context.beginPath();
    _this.context.moveTo(startCoords[0], startCoords[1]);
    _this.context.lineTo(endCoords[0], endCoords[1]);
    _this.context.strokeStyle = 'red';
    _this.context.lineWidth = 4 / _this.zoomLevel;
    _this.context.closePath();
    _this.context.stroke();
    _this.context.beginPath();
    _this.context.beginPath();
    _this.context.moveTo(endX, endY);
    _this.context.strokeStyle = 'red';
    _this.context.lineTo(x1, y1);
    _this.context.lineTo(x2, y2);
    _this.context.closePath();
    _this.context.fillStyle = 'red';
    _this.context.fill();
    _this.context.restore();


    

    infoDiv.style.display = 'flex';

    /* console.log(`F = ${i.toFixed(8)}i ${j.toFixed(8)}j N`);
    console.log(`E = ${cI.toFixed(6)}i ${cJ.toFixed(6)}j N/C`); */
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
        this.cargasObjects = [];
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
            this.cargasObjects.forEach(carga => {
              if(carga.x == Math.round(worldX) && carga.y == Math.round(worldY)){
                selectedCarga = carga;
                carga.focused = true;
              } else {
                carga.focused = false;
              }
            });
            /* if (selectedCarga) {
              this.cargasObjects.forEach(carga => {
                if (carga !== selectedCarga) {
                  const dist = carga.calculateDistance(selectedCarga.x, selectedCarga.y);
                  console.log(`Distancia de ${selectedCarga.id} a ${carga.id}: ${dist.toFixed(2)}`);

                  //Cálculo de la fuerza y el campo eléctrico
                  let forceLocal = calculateForce(selectedCarga, carga, dist);
                  let campLocal = forceLocal / selectedCarga.valor;
                  console.log(`Fuerza entre las cargas ${selectedCarga.id} y ${carga.id}: ${forceLocal} N`);
                  x = carga.x - selectedCarga.x;
                  y = carga.y - selectedCarga.y;
                  
                  force += forceLocal;
                  console.log("Valores: ");
                  console.log(x, y);

                  let [iLocal, jLocal] = vectorialForce(forceLocal, x, y);
                  let [c1, c2] = vectorialCamp(campLocal, x, y);

                  iLocal *= -1;
                  jLocal *= -1;
                  c1 *= -1;
                  console.log('C2:', c2);
                  c2 *= -1;

                  i += iLocal;
                  j += jLocal;

                  cI += c1;
                  cJ += c2;

                  console.log(`Componente de la fuerza en i: ${iLocal.toFixed(8)} N`);
                  console.log(`Componente de la fuerza en j: ${jLocal.toFixed(8)} N`);
                  console.log(`Componente del campo en i: ${c1.toFixed(8)} N/C`);
                  console.log(`Componente del campo en j: ${c2.toFixed(8)} N/C`);
                }
              });


              let infoDiv = document.getElementById('info');

              const epsilon = 1e-8;

              infoDiv.innerHTML = `
                <span class="info-span">Carga evaluada: Carga ${selectedCarga.id}</span>
                <span class="info-span">
                  F = 
                  ${Math.abs(i) < epsilon ? 0 : i.toFixed(5)}i
                  ${Math.abs(j) < epsilon ? 0 : j.toFixed(5)}j N
                </span>
                <span class="info-span">
                  E =  
                  ${Math.abs(cI) < epsilon ? 0 : cI.toFixed(5)}i 
                  ${Math.abs(cJ) < epsilon ? 0 : cJ.toFixed(5)}j N/C
                </span>
              `;

              console.log(toScientificNotation(cI));
              console.log(toScientificNotation(cJ));

              const startCoords = this.canvasCoords(selectedCarga.x, selectedCarga.y);
              const endCoords = this.canvasCoords(
                  selectedCarga.x + toScientificNotation(cI), // Multiplicar por factor para hacer visible
                  selectedCarga.y + toScientificNotation(cJ)
              );


              
              
              
              this.context.beginPath();
              this.context.moveTo(startCoords[0], startCoords[1]);
              this.context.lineTo(endCoords[0], endCoords[1]);
              this.context.strokeStyle = 'red';
              this.context.lineWidth = 2 / this.zoomLevel;
              this.context.transform(1, this.angle, 0, 1, 0, 0);
              this.context.stroke();
              this.context.save();
              

              infoDiv.style.display = 'flex';

              /* console.log(`F = ${i.toFixed(8)}i ${j.toFixed(8)}j N`);
              console.log(`E = ${cI.toFixed(6)}i ${cJ.toFixed(6)}j N/C`);
            } */

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
        this.cargasObjects = [];

        
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

        draw() {
          this.context.fillStyle = this.settings.backgroundColor;
          this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
          this.context.strokeStyle = this.settings.border.color;
          this.context.lineWidth = this.settings.border.width;
          this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height);
          this.drawGridlines();
          this.drawAxes();
          this.drawTickLabels();
          this.drawCargas(); // Añadido para dibujar las cargas
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