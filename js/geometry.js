class ToleranceNumber {
  constructor(x) {
    this.x = x;
  }
  eq(y) { return Math.abs(this.x - y) < EPS; }
  sign() {
    if (this.x > EPS) { return 1; }
    if (this.x < EPS) { return -1; }
    return 0;
  }
  in(a,b){ return a + EPS < this.x && this.x < b - EPS; }
}

class SizeModel {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
}

var EPS = 1e-10;

class Point {
  constructor(x,y) {
    this.x = x;
    this.y = y;
  }
    
  lt(p) {
    if (this.eq(p)) {
      return 0;
    } else {
      if (Num(this.x).eq(p.x)) { return this.y - p.y; } else { return this.x - p.x; }
    }
  }
  abs() { return Math.sqrt(this.norm()); }
  norm() { return (this.x * this.x) + (this.y * this.y); }
  arg() { return Math.atan2( this.y, this.x); }
  conj() { return new Point(this.x, -this.y); }
  eq(point) { return Num(this.x).eq(point.x) && Num(this.y).eq(point.y); }
  plus(point) { return new Point(this.x + point.x, this.y + point.y); }
  minus(point) { return new Point(this.x - point.x, this.y - point.y); }
  dot(point) { return (this.x * point.x) + (this.y * point.y); }
  cross(point) { return (this.x * point.y) - (this.y * point.x); }
  midPoint(point) { return new Point((this.x + point.x) / 2, (this.y + point.y) / 2); }
  rotate(angle) { return this.mult(Pt(Math.cos(angle),Math.sin(angle))); }
  mult(obj) {
    if (obj instanceof Point) {
      return new Point((this.x * obj.x) - (this.y * obj.y), (this.y * obj.x) + (this.x * obj.y));
    }
    if (typeof(obj) === 'number') {
      return new Point(this.x * obj, this.y * obj);
    }
    return undefined;
  }
  div(number) { if (typeof(number) === 'number') { return this.mult(1/number); } else { return undefined; } }

  projectTo(line) {
    let t = this.minus(line.points[1]).dot(line.vector()) * (1/line.vector().norm());
    return line.points[1].plus(line.vector().mult(t));
  }

  lineSymmetryBy(line) { return this.plus((this.projectTo(line).minus(this)).mult(2)); }
}

class LineModel {
  constructor(pos1,pos2) { this.points = [pos1,pos2]; }
  vector() { return this.points[1].minus(this.points[0]); }

  //直線に対する点の位置
  ccw(point) {
    let b = this.vector();
    let c = point.minus(this.points[0]);
    let length = b.abs() * c.abs();
    if (b.cross(c) > (length * EPS)) { return 1; }
    if (b.cross(c) < (-length * EPS)) { return -1; }
    if (b.dot(c) < 0) { return 2; }
    if (norm(b) < norm(c)) { return -2; }
    return 0;
  }

  paralell(line) { return Num(this.vector().cross(line.vector)).sign() === 0; }
  
  same(line) {
    return Num(this.vector().cross(this.points[0].minus(line.points[0]))).sign() === 0;
  }
  
  intersect(object) {
    if (object instanceof LineSegment) {
      return (Num(this.vector().cross(object.points[0] - this.points[0])).sign() *
      this.vector.cross(object.points[1] - this.points[0])) <= 0;
    }
    if (object instanceof Point) {
      return Num(this.vector.cross(object.minus(this.points[0]))).sign() === 0;
    }
    return undefined;
  }

  crossPoint(line) {
    let a = this.vector().cross(line.vector());
    let b = this.vector().cross(this.points[1].minus(line.points[0]));
    if ((Math.abs(a) < EPS) && (Math.abs(b) < EPS)) {
      return line.points[0];
    }
    if (Math.abs(a) < EPS) { return null; }
    return line.points[0].plus(line.vector().mult(b/a));
  }
}

class Circle {
  constructor(center, radius) {
    this.center = center;
    this.radius = radius;
  }
  
  static createFor3points(p1, p2, p3) {
    let dist1 = p1.norm();
    let dist2 = p2.norm();
    let dist3 = p3.norm();
    let u = 0.5 / ((((((p1.x * p2.y) - (p2.x * p1.y)) + (p2.x * p3.y)) -
      (p3.x * p2.y)) + (p3.x * p1.y)) - (p1.x * p3.y));
    let center = new Point();
    center.x = u * ((((((dist1*p2.y) - (dist2*p1.y)) + (dist2*p3.y)) -
      (dist3*p2.y)) + (dist3*p1.y)) - (dist1*p3.y));
    center.y = u * ((((((p1.x*dist2) - (p2.x*dist1)) + (p2.x*dist3)) -
      (p3.x*dist2)) + (p3.x*dist1)) - (p1.x*dist3));
    let r = center.minus(p1).abs();
    return new Circle(center, r);
  }

  static createFor2pointsAndRadius(p1, p2, r) {
    let m = p1.midPoint(p2);
    let vec = p2.minus(p1);
    let len = vec.abs();
    if (len > ((2 * r) + EPS)) { return []; }
    if (Num(len).eq(2 * r)) { return [new Circle(m, r)]; }
    let x = Math.sqrt((r * r) - ((len / 2) * (len / 2)));
    let c1 = vec.mult(Pt(0,x / vec.abs())).plus(m);
    let c2 = vec.mult(Pt(0,-x / vec.abs())).plus(m);
    let circles = [];
    circles.push(new Circle(c1, r));
    circles.push(new Circle(c2, r));
    return circles;
  }

  static create(obj1, obj2, obj3) {
    if ((obj1 instanceof Point) && (obj2 instanceof Point) &&
    (obj3 instanceof Point)) {
      return Circle.createFor3points(obj1, obj2, obj3);
    }
    if ((obj1 instanceof Point) && (obj2 instanceof Point) &&
    (typeof obj3 === 'number')) {
      return Circle.createFor2pointsAndRadius(obj1, obj2, obj3);
    }
    return null;
  }

  contain(point) { return (point.minus(this.center).abs() < this.radius); }
}

class Sector {
  constructor(center, radius, startAngle, angleSize, anticlockwise) {
    this.center = center;
    this.radius = radius;
    this.startAngle = startAngle;
    this.angleSize = angleSize;
    if (anticlockwise == null) { anticlockwise = true; }
    this.anticlockwise = anticlockwise;
  }
}

class Rectangle {
  constructor(p1, p2) {
    this.points = [];
    this.points.push(new Point(p1.x, p1.y));
    this.points.push(new Point(p2.x, p1.y));
    this.points.push(new Point(p2.x, p2.y));
    this.points.push(new Point(p1.x, p2.y));
    this.min = new Point(Math.min(p1.x,p2.x),Math.min(p1.y,p2.y));
    this.max = new Point(Math.max(p1.x,p2.x),Math.max(p1.y,p2.y));
  }

  contain(p) { return Num(p.x).in(this.min.x,this.max.x) && Num(p.y).in(this.min.y,this.max.y); }
}

class Polygonal {
  static initClass() {
    this.prototype.points  = [];
  }
  constructor(points) {
    this.points = points;
  }
}
Polygonal.initClass();

class RegPoly {}

class Path {
  constructor(points) {
    this.points = points;
  }

  base() { return this.points[0]; }

  reverse() { return new Path(this.points.reverse()); }

  eq(path) {
    for (let index = 0; index < this.points.length; index++) {
      let point = this.points[index];
      if (!point.eq(path.points[index])) { return false; }
    }
    return true;
  }

  scale(scale) {
    if (scale == null) { scale = 1; }
    let points = [this.base()];
    for (let i = 1, end = this.points.length, asc = 1 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      points.push(this.points[i].minus(this.base()).mult(scale).plus(this.base()));
    }
    return new Path(points);
  }

  rotate(angle) {
    if (angle == null) { angle = 0; }
    let points = [this.base()];
    for (let i = 1, end = this.points.length, asc = 1 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      points.push(this.points[i].minus(this.base()).rotate(angle).plus(this.base()));
    }
    return new Path(points);
  }

  trancelation(position) {
    if (position == null) { position = Pt(0,0); }
    let points = [];
    for (let point of Array.from(this.points)) {
      points.push(point.plus(position));
    }
    return new Path(points);
  }

  lineSymmetryBy(line) {
    if (line == null) { line = new Line(this.points[0],this.points[1]); }
    let points = [];
    for (let point of Array.from(this.points)) {
      points.push(point.lineSymmetryBy(line));
    }
    return new Path(points);
  }

  lineSymmetry() {
    return this.lineSymmetryBy();
  }

  directedCongruent(path, symmetry, rotate){
    if (symmetry == null) { symmetry = true; }
    if (rotate == null) { rotate = true; }
    path = path.trancelation(this.base().minus(path.base()));
    if (rotate) {
      let vec1 = this.points[1].minus(this.base());
      let vec2 = path.points[1].minus(path.base());
      let angle = Math.acos(vec1.dot(vec2) / (vec1.abs() * vec2.abs()));
      path = path.rotate(angle);
    }

    if (symmetry) {
      return this.eq(path) || this.eq(path.lineSymmetry());
    } else {
      return this.eq(path);
    }
  }

  directedSimilar(path, symmetry, rotate) {
    if (symmetry == null) { symmetry = true; }
    if (rotate == null) { rotate = true; }
    let scale = this.points[1].minus(this.points[0]).abs() /
    path.points[1].minus(path.points[0]).abs();
    return this.directedCongruent(path.scale(scale),symmetry,rotate);
  }

  congruent(path, symmetry, rotate, direct) {
    if (symmetry == null) { symmetry = true; }
    if (rotate == null) { rotate = true; }
    if (direct == null) { direct = false; }
    if (direct) {
      return this.directedCongruent(path, symmetry, rotate);
    } else {
      return this.directedCongruent(path, symmetry, rotate) ||
      this.directedCongruent(path.reverse(), symmetry, rotate);
    }
  }

  similar(path, symmetry, rotate, direct) {
    if (symmetry == null) { symmetry = true; }
    if (rotate == null) { rotate = true; }
    if (direct == null) { direct = false; }
    if (direct) {
      return this.directedSimilar(path, symmetry, rotate);
    } else {
      return this.directedSimilar(path, symmetry, rotate) ||
      this.directedSimilar(path.reverse(), symmetry, rotate);
    }
  }

  onesidedCongruent(path, direct) {
    if (direct == null) { direct = false; }
    return this.congruent(path, false, true, direct);
  }

  onesidedSimilar(path, direct) {
    if (direct == null) { direct = false; }
    return this.similar(path, false, true, direct);
  }

  fixedCongruent(path,direct) {
    if (direct == null) { direct = false; }
    return this.congruent(path, false, false, direct);
  }

  fixedSimilar(path,direct) {
    if (direct == null) { direct = false; }
    return this.similar(path, false, false, direct);
  }
}

class LineSegment extends Path {
  constructor(pos1,pos2) {  super([pos1,pos2]); }
    
  vector() { return this.points[1].minus(this.points[0]); }
  size() { return this.vector().abs(); }
  unitVector() { return this.vector().div(this.size()); }

  //直線に対する点の位置
  ccw(point) {
    let b = this.vector();
    let c = point.minus(this.points[0]);
    let length = b.abs() * c.abs();
    if (b.cross(c) > (length * EPS)) { return 1; }
    if (b.cross(c) < (-length * EPS)) { return -1; }
    if (b.dot(c) < 0) { return 2; }
    if (norm(b) < norm(c)) { return -2; }
  }

  intersect(object) {
    if (object instanceof Point) {
      return this.ccw(object) === 0;
    }
    if (object instanceof LineSegment) {
      return ((this.ccw(object.points[0]) * this.ccw(object.points[1])) <= 0) &&
        ((object.ccw(this.points[0]) * object.ccw(this.points[1])) <= 0);
    }
    return undefined;
  }

  crossPoint(line) {
    if (!this.intersect(line)) { return null; }
    let a = this.vector().cross(line.vector());
    let b = this.vector().cross(this.points[1].minus(line.points[0]));
    if ((Math.abs(a) < EPS) && (Math.abs(b) < EPS)) {
      return line.points[0];
    }
    if (Math.abs(a) < EPS) { return null; }
    return line.points[0].plus(line.vector().mult(b/a));
  }

  midPoint() { return this.points[0].midPoint(this.points[1]); }
}

class Vector extends LineSegment {
  constructor(origin, vec) {
    super([origin, origin.plus(vec)]);
    this.origin = origin;
  }
}

class FunctionGraph {
  constructor(func) {
    this.func = func;
  }
}

var Num = x => new ToleranceNumber(x);
var Pt = (x,y) => new Point(x,y);
let Polar = (r, t) => new Point(r * Math.cos(t), r * Math.sin(t));
let Cir = function(arg0,arg1, arg2) { if (typeof(arg0) === 'number') { return new Circle(Pt(arg0,arg1), arg2); } else { return new Circle(arg0, arg1); } };
let Sect = function(center, radius, startAngle, angleSize, anticlockwise) {
  if (anticlockwise == null) { anticlockwise = true; }
  return new Sector(center, radius, startAngle, angleSize, anticlockwise);
};
let Seg = (p1,p2) => new LineSegment(p1,p2);
var Line = (p1,p2) => new LineModel(p1,p2);
let Rect = (p1,p2) => new Rectangle(p1,p2);
let Poly = points => new Polygonal(points);
let Vec = (origin, vec) => new Vector(origin, vec);
let Size = (width, height) => new SizeModel(width, height);
let Func = func => new FunctionGraph(func);
let Origin = Pt(0,0);
