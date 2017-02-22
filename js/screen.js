class Screen {
  constructor() {
    this.Width = 288;
    this.Height = 288;
  }

  initialize(imageTable, model) { 
    this.field = model.field;
    this.drawField();
    this.drawGrid();
  }

  update() {
    if (this.finished) {
      return;
    }
    ++this.frameCount;
    this.drawField();
    this.drawGrid();
  }

  drawField() {
  }

  drawGrid() {
    if (!this.showGridLine) {
      return;
    }
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'rgba(64,64,64,1)';
    for(let y = 0; y < this.field.FieldHeight; ++y) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.ChipSize * y);
      this.ctx.lineTo(this.Width, this.ChipSize * y);
      this.ctx.stroke();
    }
    for(let x = 0; x < this.field.FieldWidth; ++x) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.ChipSize * x, 0);
      this.ctx.lineTo(this.ChipSize * x, this.Height);
      this.ctx.stroke();
    }
  }
} 
