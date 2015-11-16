var parser       = require("./parser");
var path         = require("path");
var fs           = require("fs");
var uglify       = require("uglify-js");
var _findAllDeps = require("../example/findAllDeps");

var currentOptions = {};

exports.transpile = function(source, options) {
  _eid = 0;
  currentOptions = options || { cwd: process.cwd() };
  return _transpile(parser.parse(source));
}

function _traverse(expr, iterator, parent) {
  iterator(expr, parent);
  expr.forEach(function(child) {
    if (typeof child === "object") _traverse(child, iterator, expr);
  });
}

function _transpile(expr) {
  // _trim(expr);
  var buffer = "var React = require('react');" +
  "module.exports = "         + _component(expr) +
  "module.exports.categories = " + _headers(expr);
  return buffer;
}

function _headers(expr) {

  var headers = [];

  _traverse(expr, function(expr) {

    var collection;
    if (expr[0] === "element" && /h\d{1}/.test(expr[1])) {
      headers.push({
        label: expr[3][0][1],
        id   : _getElementLink(expr)
      });
    }
  });

  return JSON.stringify(headers) + ";";
}


function _getElementLink(expr) {
  return _plainText(expr[3]).replace(/\s/g,"-").replace(/[^a-zA-Z0-9-_]/g,"").toLowerCase();
}

function _component(expr) {
  return "React.createClass({" +
    "render:function() {"  +
      "return " + _nodes(expr) +
    "}" +
  "});";
}

function _nodes(expr) {
  return _node(["element", "div", [["attribute", "className", "documentation"]], expr]);
}

function _node(expr) {
  return {
    element   : _element,
    text      : _text
  }[expr[0]](expr);
}

function _element(expr) {
  return ({
    Example : _exampleElement,
    Basic   : _basicElement,
    h4      : _apiElement
  }[expr[1]] || _basicElement)(expr);
}

function _apiElement(expr) {
  return "React.createElement(this.props.components.H4, {id:'" + _getElementLink(expr) + "', state: this.props.state }, [" + expr[3].map(_node).join(",") + "])";
}


var _eid = 0;

function _exampleElement(expr) {
  var buffer = "React.createElement(this.props.components.Example, {";

  var attrs = expr[2].map(_attribute).join(", ");
  buffer += attrs;

  if (attrs !== "") buffer += ", ";
  buffer += "files:";

  var files = [];

  var attrs = expr[2];

  expr[2].forEach(function(attr) {
    if (attr[1] === "file") {
      files = [_file(path.join(currentOptions.cwd, attr[2]), true)];
    } else if (attr[1] === "directory") {

      var directory = attr[2];

      files = _findAllDeps(path.join(currentOptions.cwd, directory, "index.js"));
    }
  });

  expr[3].forEach(function(child) {

    if (child[1] === "Script") {

      var content = child[3][0][1];

      files.push({
        path: child[2].filter(function(attr) {
          return attr[1] === "path";
        }).shift()[2],
        content: content
      });
    }
  });

  var ref = "example" + (_eid++);

  buffer += "this._" + ref + " || (this._" + ref + "=" + JSON.stringify(files) + ")"

  return buffer + "})";
}


function _file(filePath, entry) {
  var basename = path.basename(filePath);
  return {
    path    : basename,
    entry   : entry,
    content : fs.readFileSync(filePath, "utf8")
  };
}

function _plainText(expr) {
  var strings = [];
  _traverse(expr, function(expr) {
    if (expr[0] === "text") strings.push(expr[1]);
  });
  return strings.join(" ");
}

function _basicElement(expr) {
  var isRegisteredComponent = _isUpperCase(expr[1].charAt(0));

  var buffer = "React.createElement(" + (isRegisteredComponent ? "this.props.components." + expr[1] : "'" + expr[1] + "'");

  buffer += ", ";

  var attrBuffer = "{" + expr[2].map(_attribute).join(", ");

  // attach an ID
  if (/h[1-4]/.test(expr[1])) {
    attrBuffer += _attribute(["attribute", "id", _getElementLink(expr)]);
  }


  if (isRegisteredComponent) {
    // TODO - es6 not in yet
    // attrBuffer = "Object.assign({}, this.props, " + attrBuffer + ")";
  }

  attrBuffer += "}";

  buffer += attrBuffer;

  var childBuffer = expr[3].map(_node).join(",");

  if (childBuffer.length) {
    buffer += ", " + childBuffer;
  }

  buffer += ")";

  return buffer;
}

function _attribute(expr) {
  return "'" + expr[1] + "':'" + expr[2] + "'";
}

function _text(expr) {
  return "'" + expr[1].replace(/'/g,"\\'").replace(/[\n\r]/g," ") + "'";
}

function _p(expr) {
  // return "<p>" + expr[1] + "</p>";
  return "React.createElement('p', void 0, '" + expr[1] + "')"
}

function _isUpperCase(string) {
  return string.toUpperCase() === string;
}