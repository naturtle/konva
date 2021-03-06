import { Util, Collection } from '../Util';
import { Factory, Validators } from '../Factory';
import { Node } from '../Node';
import { Shape } from '../Shape';

import { GetSet } from '../types';

/**
 * Star constructor
 * @constructor
 * @memberof Konva
 * @augments Konva.Shape
 * @param {Object} config
 * @param {Integer} config.numPoints
 * @param {Number} config.innerRadius
 * @param {Number} config.outerRadius
 * @@shapeParams
 * @@nodeParams
 * @example
 * var star = new Konva.Star({
 *   x: 100,
 *   y: 200,
 *   numPoints: 5,
 *   innerRadius: 70,
 *   outerRadius: 70,
 *   fill: 'red',
 *   stroke: 'black',
 *   strokeWidth: 4
 * });
 */
export class Star extends Shape {
  _centroid = true;

  constructor(config) {
    // call super constructor
    super(config);
    this.className = 'Star';
    this.sceneFunc(this._sceneFunc);
  }

  _sceneFunc(context) {
    var innerRadius = this.innerRadius(),
      outerRadius = this.outerRadius(),
      numPoints = this.numPoints();

    context.beginPath();
    context.moveTo(0, 0 - outerRadius);

    for (var n = 1; n < numPoints * 2; n++) {
      var radius = n % 2 === 0 ? outerRadius : innerRadius;
      var x = radius * Math.sin((n * Math.PI) / numPoints);
      var y = -1 * radius * Math.cos((n * Math.PI) / numPoints);
      context.lineTo(x, y);
    }
    context.closePath();

    context.fillStrokeShape(this);
  }
  // implements Shape.prototype.getWidth()
  getWidth() {
    return this.outerRadius() * 2;
  }
  // implements Shape.prototype.getHeight()
  getHeight() {
    return this.outerRadius() * 2;
  }
  // implements Shape.prototype.setWidth()
  setWidth(width) {
    if (this.outerRadius() !== width / 2) {
      this.outerRadius(width / 2);
    }
  }
  // implements Shape.prototype.setHeight()
  setHeight(height) {
    if (this.outerRadius() !== height / 2) {
      this.outerRadius(height / 2);
    }
  }

  outerRadius: GetSet<number, this>;
  innerRadius: GetSet<number, this>;
  numPoints: GetSet<number, this>;
}

/**
 * get/set number of points
 * @name numPoints
 * @method
 * @memberof Konva.Ring.prototype
 * @param {Number} numPoints
 * @returns {Number}
 * @example
 * // get inner radius
 * var numPoints = ring.numPoints();
 *
 * // set inner radius
 * ring.numPoints(20);
 */
Factory.addGetterSetter(Star, 'numPoints', 5, Validators.getNumberValidator());

/**
 * get/set innerRadius
 * @name innerRadius
 * @method
 * @memberof Konva.Ring.prototype
 * @param {Number} innerRadius
 * @returns {Number}
 * @example
 * // get inner radius
 * var innerRadius = ring.innerRadius();
 *
 * // set inner radius
 * ring.innerRadius(20);
 */
Factory.addGetterSetter(
  Star,
  'innerRadius',
  0,
  Validators.getNumberValidator()
);

/**
 * get/set outerRadius
 * @name outerRadius
 * @method
 * @memberof Konva.Ring.prototype
 * @param {Number} outerRadius
 * @returns {Number}
 * @example
 * // get inner radius
 * var outerRadius = ring.outerRadius();
 *
 * // set inner radius
 * ring.outerRadius(20);
 */

Factory.addGetterSetter(
  Star,
  'outerRadius',
  0,
  Validators.getNumberValidator()
);

Collection.mapMethods(Star);
