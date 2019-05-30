const request = require('request');

const origRequestInit = request.Request.prototype.init;
request.Request.prototype.init = function(options) {
  if (options && options.ALPNProtocols) {
    this.ALPNProtocols = options.ALPNProtocols;
  }
  return origRequestInit.apply(this, arguments);
};

module.exports = request;
