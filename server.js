var connect = require('connect');
var serveStatic = require('serve-static');
var ws = require('ws');
connect().use(serveStatic(__dirname)).listen(8080);
