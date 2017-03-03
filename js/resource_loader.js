class ResourceLoader {
  constructor(finish) {
    if (finish == null) {
      this.finish = function() {}
    }
    else {
      this.finish = finish; 
    }
    this.resourceTable = {
    }
    this.resourceCount = Object.keys(this.resourceTable).length;
    this.imageTable = {};
    this.loadCount = 0;
  }

  preload() {
    for(let key in this.resourceTable)
    {
      var img = new Image();
      this.imageTable[key] = img;
      img.src = 'res/' + this.resourceTable[key];
      img.onload = this.loadFinish.bind(null, key, this);
    }
  }

  loadFinish(key, self, e) {
    ++self.loadCount;
    if (self.loadCount === self.resourceCount) {
      self.finish();
    }
  }
}
