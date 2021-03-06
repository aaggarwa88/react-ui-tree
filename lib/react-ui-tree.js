var Tree = require('./tree');

import React from 'react'
import Node from './node'
import keydown from 'react-keydown';

class FullTree extends React.Component {

  constructor(props) {
    super(props)
    this.state = this.init(props)

    this.toggleCollapse = this.toggleCollapse.bind(this);
    this.dragStart = this.dragStart.bind(this);

    this.drag = this.drag.bind(this);
    this.dragEnd = this.dragEnd.bind(this);

  }


  componentWillReceiveProps(nextProps) {
    if(!this._updated) this.setState(this.init(nextProps));
    else this._updated = false;
  }

  init(props) {
    var tree = new Tree(props.tree);
    tree.isNodeCollapsed = props.isNodeCollapsed;
    tree.renderNode = props.renderNode;
    tree.changeNodeCollapsed = props.changeNodeCollapsed;
    tree.updateNodesPosition();

    return {
      tree: tree,
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null,

      }
    };
  }

  getDraggingDom() {
    var tree = this.state.tree;
    var dragging = this.state.dragging;

    if(dragging && dragging.id) {
      var draggingIndex = tree.getIndex(dragging.id);
      var draggingStyles = {
        top: dragging.y,
        left: dragging.x,
        width: dragging.w
      };

      return (
        <div className="m-draggable" style={draggingStyles}>
          <Node
            tree={tree}
            index={draggingIndex}
            paddingLeft={this.props.paddingLeft}
          />
        </div>
      );
    }

    return null;
  }

  render() {
    var tree = this.state.tree;
    var dragging = this.state.dragging;
    var draggingDom = this.getDraggingDom();

    return (
      <div className="m-tree">
        {draggingDom}
        <Node
          tree={tree}
          index={tree.getIndex(1)}
          key={1}
          paddingLeft={this.props.paddingLeft}
          onDragStart={this.dragStart}
          onCollapse={this.toggleCollapse}
          dragging={dragging && dragging.id}
        />
      </div>
    );
  }

  dragStart(id, dom, e) {
    this.dragging = {
      id: id,
      w: dom.offsetWidth,
      h: dom.offsetHeight,
      x: dom.offsetLeft,
      y: dom.offsetTop
    };

    this._startX = dom.offsetLeft;
    this._startY = dom.offsetTop;
    this._offsetX = e.clientX;
    this._offsetY = e.clientY;
    this._start = true;

    window.addEventListener('mousemove', this.drag);
    window.addEventListener('mouseup', this.dragEnd);
  }

  // oh
  drag(e) {
    if(this._start) {
      this.setState({
        dragging: this.dragging
      });
      this._start = false;
    }

    var tree = this.state.tree;
    var dragging = this.state.dragging;
    var paddingLeft = this.props.paddingLeft;
    var newIndex = null;
    var index = tree.getIndex(dragging.id);
    var collapsed = index.node.collapsed;

    var _startX = this._startX;
    var _startY = this._startY;
    var _offsetX = this._offsetX;
    var _offsetY = this._offsetY;

    var pos = {
      x: _startX + e.clientX - _offsetX,
      y: _startY + e.clientY - _offsetY
    };
    dragging.x = pos.x;
    dragging.y = pos.y;

    var diffX = dragging.x - paddingLeft/2 - (index.left-2) * paddingLeft;
    var diffY = dragging.y - dragging.h/2 - (index.top-2) * dragging.h;

    if(diffX < 0) { // left
      if(index.parent && !index.next) {
        newIndex = tree.move(index.id, index.parent, 'after');
      }
    } else if(diffX > paddingLeft) { // right
      if(index.prev) {
        var prevNode = tree.getIndex(index.prev).node;
        if(!prevNode.collapsed && !prevNode.leaf) {
          newIndex = tree.move(index.id, index.prev, 'append');
        }
      }
    }

    if(newIndex) {
      index = newIndex;
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    if(diffY < 0) { // up
      var above = tree.getNodeByTop(index.top-1);
      newIndex = tree.move(index.id, above.id, 'before');
    } else if(diffY > dragging.h) { // down
      if(index.next) {
        var below = tree.getIndex(index.next);
        if(below.children && below.children.length && !below.node.collapsed) {
          newIndex = tree.move(index.id, index.next, 'prepend');
        } else {
          newIndex = tree.move(index.id, index.next, 'after');
        }
      } else {
        var below = tree.getNodeByTop(index.top+index.height);
        if(below && below.parent !== index.id) {
          if(below.children && below.children.length) {
            newIndex = tree.move(index.id, below.id, 'prepend');
          } else {
            newIndex = tree.move(index.id, below.id, 'after');
          }
        }
      }
    }

    if(newIndex) {
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    if(!this._newIndex)
      this._newIndex = newIndex ? true : false;

    this.setState({
      tree: tree,
      dragging: dragging
    });
  }

  dragEnd() {
    this.setState({
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null
      }
    });

    this.change(this.state.tree);
    window.removeEventListener('mousemove', this.drag);
    window.removeEventListener('mouseup', this.dragEnd);
  }

  change(tree) {
    if(this.props.onChange && this._newIndex){
      this.props.onChange(tree.obj);
    }
    this._newIndex = false;
    this._updated = true;
  }

  toggleCollapse(nodeId) {
    var tree = this.state.tree;
    var index = tree.getIndex(nodeId);
    var node = index.node;
    node.collapsed = !node.collapsed;
    tree.updateNodesPosition();

    this.setState({
      tree: tree
    });

    this.change(tree);
  }
}

FullTree.propTypes = {
  tree: React.PropTypes.object.isRequired,
  paddingLeft: React.PropTypes.number,
  renderNode: React.PropTypes.func.isRequired
};

FullTree.defaultProps = {
  paddingLeft: 20
};

module.exports = FullTree;
