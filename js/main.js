class Runner {
  start() {
    this.manager = new Manager();
    this.manager.create(logicgames19);
  } 
}

runner = new Runner();
window.onload = runner.start; 
