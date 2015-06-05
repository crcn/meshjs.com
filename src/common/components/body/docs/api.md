#### operation op(name[, operation])

Creates a new operation. This method is equivalent to `{ name: "operation" }`.

<Example>
  <Script path="index.js">
var mesh = require("mesh");

var bus = mesh.wrap(function(operation, next) {
  console.log(operation);
  next();
});

bus(mesh.op("doSomething")).on("end", function() {
  console.log("ended");
});

// or use a vanilla object
bus({ name: "doSomething" }).on("end", function() {
  console.log("endeded vanilla object");
});
  </Script>
</Example>

#### bus attach(props, bus)

Attaches properties to an `operation`.

Here is a basic example of how you might use this function to decouple

<Example>
  <Script path="index.js">

var extend = require("extend");
var mesh   = require("mesh");

function BaseModel(properties) {
  extend(this, properties);
  this.load = function(onLoad) {
    this
    .bus(mesh.op("load"))
    .on("data", extend.bind(void 0, this))
    .once("end", onLoad || function() { });
  }
}

function UserModel(properties) {
  BaseModel.call(this, properties);
}

extend(UserModel.prototype, BaseModel.prototype);

var bus = mesh.wrap(function(operation, next) {
  console.log("handled operation: ", operation);
  next(void 0, operation.fakeData);
});

var user = new UserModel({
  bus: mesh.attach({ collection: "users", fakeData: { name: "bob" } }, bus)
});

user.load(function() {
  console.log("loaded: ", user);
});

  </Script>
</Example>

Here's another example using a function to map operation properties:

<Example>
  <Script path="index.js">
var mesh = require("mesh");
var bus  = mesh.wrap(function(operation, next) {
  console.log("handled operation:", operation);
});

bus = mesh.attach(function(operation) {
  return {
    path : "/" + operation.collection,
    method: {
      insert : "POST",
      remove : "DELETE",
      load   : "GET",
      update : "UPDATE"
    }[operation.name]
  }
}, bus);

bus(mesh.op("load", { collection: "users" }));

  </Script>
</Example>


#### bus accept(conditon, bus[, ebus])

#### bus reject(condition, bus[, ebus])

#### bus stream.tailable(bus)

#### bus parallel([busses])

#### bus sequence([busses])

#### bus fallback([busses])

#### bus race([busses])

#### bus wrap(callback)

#### bus stream(callback)

#### bus limit(count, bus)

#### bus map(bus, map)

#### bus reduce(bus, reduce)

#### bus catchError(bus, handler)

#### bus noop