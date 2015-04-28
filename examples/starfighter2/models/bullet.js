var Entity = require("./entity");

module.exports = Entity.extend({
  ttl: 1000 * 5,
  update: function() {
    if (Date.now() > this.timestamp + this.ttl) {
      return this.explode();
    }
  }
});
