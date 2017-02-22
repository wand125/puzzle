class Runner {
  start() {
    this.manager = new Manager();
    manager.create();
  } 
}

runner = new Runner();
window.onload = runner.start; 
