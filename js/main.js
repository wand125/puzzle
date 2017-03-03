class Runner {
  start() {
    this.manager = new Manager();
    this.manager.create(nikoli3);
  } 
}

runner = new Runner();
window.onload = runner.start; 
