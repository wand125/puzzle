class Manager {
  create() {
    this.screen = new Screen();
    this.resourceLoader= new ResourceLoader(this.start.bind(this));
    this.resourceLoader.preload();
    this.model = new Model();
  }

  start() {
    this.screen.initialize(this.resourceLoader.imageTable, this.model);
    setInterval(this.update.bind(this), 1000/20);
  } 

  update() {
    this.screen.update();
  }
}
