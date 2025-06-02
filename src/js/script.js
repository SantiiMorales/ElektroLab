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

      class CoordinateSystem {
        constructor(canvas) {
          this.canvas = canvas
          this.context = this.canvas.getContext('2d')
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
          }

          this.zoomLevel = 1
          this.zoomMatrix = new Matrix([
            [100, 0],
            [0, 100],
          ])
          this.translation = new Matrix([[1], [1]])

          const mouseState = {
            pressed: false,
            prevPosistion: null,
          }

          this.canvas.addEventListener('mousedown', e => {
            mouseState.pressed = true
          })

          this.canvas.addEventListener('mouseup', e => {
            mouseState.pressed = false
          })

          this.canvas.addEventListener('mouseleave', e => {
            mouseState.pressed = false
          })

          this.canvas.addEventListener('mousemove', e => {
            const x = e.offsetX
            const y = e.offsetY

            if (mouseState.pressed && mouseState.prevPosistion) {
              const currentPosition = this.fromCanvasCoords(x, y)
              const prevPosistion = this.fromCanvasCoords(
                mouseState.prevPosistion[0],
                mouseState.prevPosistion[1]
              )

              this.translate(
                currentPosition[0] - prevPosistion[0],
                currentPosition[1] - prevPosistion[1]
              )
            }
            mouseState.prevPosistion = [x, y]
          })

          this.canvas.addEventListener('mousewheel', e => {
            e.preventDefault()
            const x = e.offsetX
            const y = e.offsetY
            const zoomFactor = 0.001 * e.wheelDelta
            this.zoom(zoomFactor, x, y)
          })

          this.draw()
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

            this.context.stroke()
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
          this.context.fillStyle = this.settings.backgroundColor
          this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
          this.context.strokeStyle = this.settings.border.color
          this.context.lineWidth = this.settings.border.width
          this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height)
          this.drawGridlines()
          this.drawAxes()
          this.drawTickLabels()
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

      document.addEventListener("DOMContentLoaded", () => {
      const canvas = document.getElementById("physicsCanvas");
      const grid = new CoordinateSystem(canvas);
      
      });

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