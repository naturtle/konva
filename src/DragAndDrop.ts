import { Animation } from './Animation';
import { Node } from './Node';
import { Factory } from './Factory';
import { isBrowser, getGlobalKonva } from './Global';
// import { getBl}

export const DD = {
  startPointerPos: {
    x: 0,
    y: 0
  },
  // properties
  anim: new Animation(function() {
    var b = this.dirty;
    this.dirty = false;
    return b;
  }),
  isDragging: false,
  justDragged: false,
  offset: {
    x: 0,
    y: 0
  },
  node: null,

  // methods
  _drag(evt) {
    var dd = DD,
      node = dd.node;
    if (node) {
      if (!dd.isDragging) {
        var pos = node.getStage().getPointerPosition();
        // it is possible that pos is undefined
        // reattach it
        if (!pos) {
          node.getStage()._setPointerPosition(evt);
          pos = node.getStage().getPointerPosition();
        }
        var dragDistance = node.dragDistance();
        var distance = Math.max(
          Math.abs(pos.x - dd.startPointerPos.x),
          Math.abs(pos.y - dd.startPointerPos.y)
        );
        if (distance < dragDistance) {
          return;
        }
      }

      node.getStage()._setPointerPosition(evt);
      if (!dd.isDragging) {
        dd.isDragging = true;
        node.fire(
          'dragstart',
          {
            type: 'dragstart',
            target: node,
            evt: evt
          },
          true
        );
        // a user can stop dragging inside `dragstart`
        if (!node.isDragging()) {
          return;
        }
      }
      node._setDragPosition(evt);

      // execute ondragmove if defined
      node.fire(
        'dragmove',
        {
          type: 'dragmove',
          target: node,
          evt: evt
        },
        true
      );
    }
  },
  _endDragBefore(evt) {
    var dd = DD,
      node = dd.node,
      layer;

    if (node) {
      layer = node.getLayer();
      dd.anim.stop();

      // only fire dragend event if the drag and drop
      // operation actually started.
      if (dd.isDragging) {
        dd.isDragging = false;
        dd.justDragged = true;
        getGlobalKonva().listenClickTap = false;

        if (evt) {
          evt.dragEndNode = node;
        }
      }

      delete dd.node;

      if (layer || node instanceof getGlobalKonva().Stage) {
        (layer || node).draw();
      }
    }
  },
  _endDragAfter(evt) {
    evt = evt || {};
    var dragEndNode = evt.dragEndNode;

    if (evt && dragEndNode) {
      dragEndNode.fire(
        'dragend',
        {
          type: 'dragend',
          target: dragEndNode,
          evt: evt
        },
        true
      );
    }
  }
};

// Node extenders

/**
 * initiate drag and drop
 * @method
 * @memberof Konva.Node.prototype
 */
Node.prototype.startDrag = function() {
  var dd = DD,
    stage = this.getStage(),
    layer = this.getLayer(),
    pos = stage.getPointerPosition(),
    ap = this.getAbsolutePosition();

  if (pos) {
    if (dd.node) {
      dd.node.stopDrag();
    }

    dd.node = this;
    dd.startPointerPos = pos;
    dd.offset.x = pos.x - ap.x;
    dd.offset.y = pos.y - ap.y;
    dd.anim.setLayers(layer || this.getLayers());
    dd.anim.start();

    this._setDragPosition();
  }
};

Node.prototype._setDragPosition = function(evt) {
  var dd = DD,
    pos = this.getStage().getPointerPosition(),
    dbf = this.getDragBoundFunc();
  if (!pos) {
    return;
  }
  var newNodePos = {
    x: pos.x - dd.offset.x,
    y: pos.y - dd.offset.y
  };

  if (dbf !== undefined) {
    newNodePos = dbf.call(this, newNodePos, evt);
  }
  this.setAbsolutePosition(newNodePos);

  if (
    !this._lastPos ||
    this._lastPos.x !== newNodePos.x ||
    this._lastPos.y !== newNodePos.y
  ) {
    dd.anim['dirty'] = true;
  }

  this._lastPos = newNodePos;
};

/**
 * stop drag and drop
 * @method
 * @memberof Konva.Node.prototype
 */
Node.prototype.stopDrag = function() {
  var dd = DD,
    evt = {};
  dd._endDragBefore(evt);
  dd._endDragAfter(evt);
};

Node.prototype.setDraggable = function(draggable) {
  this._setAttr('draggable', draggable);
  this._dragChange();
};

var origRemove = Node.prototype.remove;

Node.prototype['__originalRemove'] = origRemove;
Node.prototype.remove = function() {
  var dd = DD;

  // stop DD
  if (dd.node && dd.node._id === this._id) {
    this.stopDrag();
  }

  return origRemove.call(this);
};

/**
 * determine if node is currently in drag and drop mode
 * @method
 * @memberof Konva.Node.prototype
 */
Node.prototype.isDragging = function() {
  var dd = DD;
  return !!(dd.node && dd.node._id === this._id && dd.isDragging);
};

Node.prototype._listenDrag = function() {
  var that = this;

  this._dragCleanup();

  if (this.getClassName() === 'Stage') {
    this.on('contentMousedown.konva contentTouchstart.konva', function(evt) {
      if (!DD.node) {
        that.startDrag(evt);
      }
    });
  } else {
    this.on('mousedown.konva touchstart.konva', function(evt) {
      // ignore right and middle buttons
      if (evt.evt.button === 1 || evt.evt.button === 2) {
        return;
      }
      if (!DD.node) {
        that.startDrag(evt);
      }
    });
  }

  // listening is required for drag and drop
  /*
        this._listeningEnabled = true;
        this._clearSelfAndAncestorCache('listeningEnabled');
        */
};

Node.prototype._dragChange = function() {
  if (this.attrs.draggable) {
    this._listenDrag();
  } else {
    // remove event listeners
    this._dragCleanup();

    /*
     * force drag and drop to end
     * if this node is currently in
     * drag and drop mode
     */
    var stage = this.getStage();
    var dd = DD;
    if (stage && dd.node && dd.node._id === this._id) {
      dd.node.stopDrag();
    }
  }
};

Node.prototype._dragCleanup = function() {
  if (this.getClassName() === 'Stage') {
    this.off('contentMousedown.konva');
    this.off('contentTouchstart.konva');
  } else {
    this.off('mousedown.konva');
    this.off('touchstart.konva');
  }
};

Factory.addGetterSetter(Node, 'dragBoundFunc');

/**
 * get/set drag bound function.  This is used to override the default
 *  drag and drop position.
 * @name dragBoundFunc
 * @method
 * @memberof Konva.Node.prototype
 * @param {Function} dragBoundFunc
 * @returns {Function}
 * @example
 * // get drag bound function
 * var dragBoundFunc = node.dragBoundFunc();
 *
 * // create vertical drag and drop
 * node.dragBoundFunc(function(pos){
 *   // important pos - is absolute position of the node
 *   // you should return absolute position too
 *   return {
 *     x: this.getAbsolutePosition().x,
 *     y: pos.y
 *   };
 * });
 */

Factory.addGetter(Node, 'draggable', false);
Factory.addOverloadedGetterSetter(Node, 'draggable');

/**
 * get/set draggable flag
 * @name draggable
 * @method
 * @memberof Konva.Node.prototype
 * @param {Boolean} draggable
 * @returns {Boolean}
 * @example
 * // get draggable flag
 * var draggable = node.draggable();
 *
 * // enable drag and drop
 * node.draggable(true);
 *
 * // disable drag and drop
 * node.draggable(false);
 */

if (isBrowser) {
  window.addEventListener('mouseup', DD._endDragBefore, true);
  window.addEventListener('touchend', DD._endDragBefore, true);

  window.addEventListener('mousemove', DD._drag);
  window.addEventListener('touchmove', DD._drag);

  window.addEventListener('mouseup', DD._endDragAfter, false);
  window.addEventListener('touchend', DD._endDragAfter, false);
}
