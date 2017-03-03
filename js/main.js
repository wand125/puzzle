class Runner {
  start() {
    this.manager = new Manager();
    this.manager.create(kurotora);
  } 
}

runner = new Runner();
window.onload = runner.start; 
