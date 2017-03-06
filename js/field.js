const CellType = {
  Wall : -1,
  Unknown: 0,
  /* Room Id 1..*/
  /* Blank Id */
  Blank : 65535,
}

class Room {
  constructor() {
    // Room ID
    this.id = null;
    // 部屋の大きさ
    this.roomSize = null;
    // 候補マス
    this.prediction = null;
    // 確定フラグ
    this.fix = false;
  }
}

class Field {
  constructor() {
    this.result = [];
    this.rooms = [];
    this.dx = [1,0,-1,0];
    this.dy = [0,1,0,-1];
    this.assumption = [];
    this.updateCount = 0;
  }

  getX(posId) {return posId % this.width;}
  getY(posId) {return Math.floor(posId / this.width);}
  posId(x, y) {return y * this.width + x; } 

  getProblem(id) {return this.problem[this.getY(id)][this.getX(id)];}
  getBoard(id) {
    if (this.assumption[id] != null) {
      return this.assumption[id];
    }
    return this.result[id];
  }

  * range(n) { for (let i = 0; i < n; ++i) { yield i; } }
  * boardIds() { yield* this.range(this.width * this.height); }

  // 周囲を探索
  * getDelta(id) {
    if (this.getX(id) !== this.width - 1) {yield id + this.delta[0];}
    if (this.getY(id) !== this.height - 1) {yield id + this.delta[1];}
    if (this.getX(id) !== 0) {yield id + this.delta[2];}
    if (this.getY(id) !== 0) {yield id + this.delta[3];}
  }

  // 指定したIDを左上とする2x2の空間に存在する壁の個数
  wallCount(id) {
    return (this.getBoard(id) === CellType.Wall ? 1 : 0)
      + (this.getBoard(id + this.posId(1,0)) === CellType.Wall ? 1 : 0)
      + (this.getBoard(id + this.posId(0,1)) === CellType.Wall ? 1 : 0)
      + (this.getBoard(id + this.posId(1,1)) === CellType.Wall ? 1 : 0);
  }

  // 2x2の黒マスの正方形が存在しない
  checkSquare() {
    return !this.boardIdArray
      .filter(id => this.getX(id) < this.width - 1)
      .filter(id => this.getY(id) < this.height - 1)
      .some(id => this.wallCount(id) === 4);
  }

  // すべての壁が分断されていない
  checkWallConnection() {
    let walls = this.boardIdArray.filter(_ => this.getBoard(_) === CellType.Wall);
    if (walls.length === 0) {
      // has no wall
      return true;
    }
    let painted = this.boardIdArray.map(_ => _ == walls[0]);

    let flag;
    do {
      flag = false;
      this.boardIdArray
        .filter((id) => painted[id])
        .forEach((id) => Array.from(this.getDelta(id))
            .filter(_=> this.getBoard(_) <= 0 && !painted[_])
            .forEach(_ => {
              painted[_] = true; 
              flag = true;
            }));
    } while(flag);
    return walls.every(id => painted[id]);
  }

  // 数字から分断された確定白マスが存在しない
  checkSpaceConnection() {
    let blanks = this.boardIdArray.filter(_ => this.getBoard(_) === CellType.Blank);

    if (blanks.length === 0) {
      // has no blank
      return true;
    }

    let painted = this.boardIdArray.map(_ => this.getProblem(_) > 0);
    let flag;
    do {
      flag = false;
      this.boardIdArray
        .filter((id) => painted[id])
        .forEach((id) => Array.from(this.getDelta(id))
            .filter(_=> this.getBoard(_) >= 0 && !painted[_])
            .forEach(_ => {
              painted[_] = true; 
              flag = true;
            }));
    } while(flag);
    return blanks.every(id => painted[id]); 
  }

  checkRoomSizeOver(room) {
    let painted = this.boardIdArray.map(id => this.getBoard(id) === room.id);
    let ret = this.boardIdArray.filter(id => this.getBoard(id) === room.id);
    let current = ret;
    while(current.length > 0) {
      let next = [];
      current.forEach((id) => Array.from(this.getDelta(id))
          .filter(_ => !painted[_] && (this.getBoard(_) === room.id || this.getBoard(_) === CellType.Blank))
          .forEach(_ => {
            painted[_] = true;
            ret.push(_);
            next.push(_);
          }));
      current = next;
    }
    return ret.length <= room.roomSize;
  }

  // 部屋になりうるマスの候補を探索
  calcRoomPrediction(room) {
    // 数字のある場所は1 (部屋の候補)
    // 他の数字のある場所は-1 (候補対象外)
    let ret = this.boardIdArray.map(id => (this.getBoard(id) === room.id && this.getProblem(id) > 0)
        ? 1
        : ((this.getBoard(id) !== room.id && 0 < this.getBoard(id) && this.getBoard(id) < CellType.Blank) ? -1 : 0)
        );
    // 他の数字の周囲1マスは-1 (候補対象外)
    this.boardIdArray
      .filter(id => ret[id] === -1)
      .forEach((id) => Array.from(this.getDelta(id)).forEach(_ => ret[_] = -1));
    // 壁のある位置は-1 (候補対象外)
    this.boardIdArray
      .filter(id => this.getBoard(id) === CellType.Wall)
      .forEach((id) => ret[id] = -1);

    // 候補対象外を除く、数字のマスからの到達可能マスを幅優先探索
    for(let i = 0; i < room.roomSize - 1; ++i) {
      this.boardIdArray
        .filter(id => ret[id] === 1)
        .forEach((id) => Array.from(this.getDelta(id))
            .filter(_=> ret[_] === 0)
            .forEach( _ => ret[_] = 1)
            );
    }
    return ret;
  }

  // 部屋になりうるマスの候補が部屋の数未満の場合、その部屋のidを返します
  // 部屋になりうるますの候補が部屋の数未満の部屋がない場合-1を返します 
  checkRoomPredictionSize() {
    // 部屋になりうるマスの候補が部屋の数未満である
    for(let room of this.rooms.filter(room => !room.fix)) {
      let prediction = this.calcRoomPrediction(room);
      if (prediction.filter(_ => _ === 1).length < room.roomSize) {
        return room.id;
      }
    }
    return -1;
  }

  // 初期処理
  init(problem) {
    this.problem = problem;
    this.height = this.problem.length;
    this.width = this.problem[0].length; 
    this.delta = Array.from(this.range(4)).map(i => this.dy[i] * this.width + this.dx[i]);
    this.boardIdArray = Array.from(this.boardIds());

    let roomId = 0;
    this.result = this.boardIdArray 
      .map(id  => this.getProblem(id) !== 0 ? ++roomId: CellType.Unknown);

    this.boardIdArray
      .filter(id => this.getProblem(id) !== 0)
      .forEach(id => {
        let room = new Room();
        room.id = this.getBoard(id);
        room.roomSize = this.getProblem(id);
        this.rooms.push(room);
      });
    this.roomCount = this.rooms.length;
  }

  // 更新処理
  update() {
    ++this.updateCount;

    let flag = false;

    // 未確定の部屋に対して、確定しているか判定
    this.rooms.filter(room => !room.fix).forEach(room => {
      // 部屋候補のマスを更新 
      room.prediction = this.calcRoomPrediction(room);
      // 候補部屋サイズ
      let predictionRoomSize = room.prediction.filter(_ => _ === 1).length;
      // 確定部屋サイズ
      let settledRoomSize = this.result.filter(_ => _ === room.id).length;

      if (predictionRoomSize === room.roomSize) {
        // 候補マスが部屋の大きさに等しい: 部屋の確定
        this.boardIdArray
          .filter(id => room.prediction[id] === 1)
          .forEach((id) => {
            // 部屋にRoomIdを設定
            this.result[id] = room.id;
            // 周囲を壁にする
            Array.from(this.getDelta(id))
              .filter(_=> this.result[_] === 0)
              .filter(_=> room.prediction[_] !== 1)
              .forEach(_ => this.result[_] = CellType.Wall);
          }
          );
        room.fix = true;
        flag = true;
      }
      else if (settledRoomSize === room.roomSize) {
        // 確定マスが部屋の大きさに等しい: 部屋の確定
        // 周囲を壁にする
        this.boardIdArray
          .filter(id => this.result[id] === room.id)
          .forEach(id => {
            Array.from(this.getDelta(id))
              .filter(_=> this.result[_] === CellType.Unknown)
              .forEach(_ => this.result[_] = CellType.Wall);
          });
        room.fix = true;
        flag = true;
      }
      else if (settledRoomSize === room.roomSize - 1
          && predictionRoomSize === room.roomSize + 1) {
        let prediction = this.boardIdArray.filter( id => this.result[id] !== room.id && room.prediction[id] === 1);
        // 処理

        (() => {
          if (this.getX(prediction[0]) !== 0
              && prediction[1] - prediction[0] === this.width - 1) {
            // *: prediction
            // _*
            // *_
            return [prediction[0] - 1, prediction[1] + 1];
          }
          else if (this.getX(prediction[0]) !== this.width - 1
              && prediction[1] - prediction[0] === this.width + 1) {
            // *: prediction
            // *_
            // _*
            return [prediction[0] + 1, prediction[1] - 1];
          }
          else {
            return [];
          }
        })().filter(id => this.result[id] === CellType.Unknown)
          .forEach(id => {
            this.result[id] = CellType.Wall;
            flag = true;
          });
      }
    });

  // どの数字からも進入不可能なマスを壁に設定
  this.boardIdArray.forEach((id) => {
    if (this.rooms.every(room => room.prediction[id] === -1)) {
      if (this.result[id] === CellType.Unknown) {
        this.result[id] = CellType.Wall;
        flag = true;
      }
    }
  });
  // どの数字からも到達不可能なマスを壁に設定
  this.boardIdArray.forEach((id) => {
    if (this.rooms.every(room => room.prediction[id] === 0)) {
      if (this.result[id] === CellType.Unknown) {
        this.result[id] = CellType.Wall;
        flag = true;
      }
    }
  });

  // 所属が確定する白マスに隣接する白マスの部屋を確定
  this.boardIdArray
    .filter(id => this.result[id] === CellType.Blank)
    .forEach(id => {
      let around = Array.from(this.getDelta(id))
        .filter(_ => 0 < this.result[_] && this.result[_] < CellType.Blank)
        .map(_ => this.result[_]);
      if (around.length > 0) { 
        this.result[id] = around[0]; 
        flag = true;
      }
    });

  for(let id of this.boardIdArray.filter(id => this.getBoard(id) === CellType.Unknown)) {
    // 白マスを仮定
    this.assumption[id] = CellType.Blank;
    if (!this.checkWallConnection()) {
      this.result[id] = CellType.Wall;
      flag = true;
      this.assumption[id] = null;
      continue;
    }
    if (!this.rooms.filter(room => !room.fix).every(room => this.checkRoomSizeOver(room))) {
      this.result[id] = CellType.Wall;
      flag = true;
      this.assumption[id] = null;
      continue;
    }

    // 黒マスを仮定
    this.assumption[id] = CellType.Wall;
    if (!this.checkSquare()) {
      this.result[id] = CellType.Blank;
      flag = true;
      this.assumption[id] = null;
      continue;
    }

    let checkRoomPredictionSize = this.checkRoomPredictionSize();
    if (checkRoomPredictionSize > 0) {
      this.result[id] = checkRoomPredictionSize;
      flag = true;
      this.assumption[id] = null;
      continue;
    }
    if (!this.checkSpaceConnection()) {
      this.result[id] = CellType.Blank;
      flag = true;
      this.assumption[id] = null;
      continue;
    }
    this.assumption[id] = null;
  }
  return flag;
}
} 
