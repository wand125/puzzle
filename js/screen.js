class Screen {
  constructor() {
    this.Width = 480;
    this.Height = 480;
    this.CellSize = 36;
    this.canvas = document.querySelector('#screen');
    this.ctx = this.canvas.getContext('2d');
  }

  initialize(imageTable, model) { 
    this.field = model.field;
    this.frameCount = 0;
    this.showGridLine = true;
    this.CellSize = Math.min(this.Width / this.field.width, this.Height / this.field.height);
    this.drawField();
    this.drawGrid();
  }

  update() {
    if (this.finished) {
      return;
    }
    ++this.frameCount;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0,0,this.Width, this.Height);
    this.drawGrid();
    this.drawField();
  }

  drawField() {
    this.ctx.fillStyle = '#000';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = Math.floor(this.CellSize * 3 / 4)+"px 'Arial'";
    
    for(let y = 0; y < this.field.height; ++y) {
      for(let x = 0; x < this.field.width; ++x) {
        if (this.field.result[this.field.posId(x,y)] === CellType.Wall) {
          this.ctx.fillRect(x * this.CellSize, y * this.CellSize, this.CellSize, this.CellSize);
        }
        else if (this.field.problem[y][x] > 0)
        {
          this.ctx.fillText(this.field.problem[y][x].toString(), x * this.CellSize + this.CellSize / 2, y * this.CellSize + this.CellSize / 2);
        }
        else if(this.field.result[this.field.posId(x, y)] > 0){
          this.ctx.fillRect(x * this.CellSize + this.CellSize * 3 / 8, y * this.CellSize + this.CellSize * 3 / 8, this.CellSize / 4, this.CellSize / 4);
        }
      }
    }
  }

  drawGrid() {
    if (!this.showGridLine) {
      return;
    }
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'rgba(64,64,64,1)';
    for(let y = 0; y < this.field.height + 1; ++y) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.CellSize * y);
      this.ctx.lineTo(this.Width, this.CellSize * y);
      this.ctx.stroke();
    }
    for(let x = 0; x < this.field.width + 1 ; ++x) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.CellSize * x, 0);
      this.ctx.lineTo(this.CellSize * x, this.Height);
      this.ctx.stroke();
    }
  }
} 
