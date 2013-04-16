/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var http = require('http'),
    sqlite3 = require('sqlite3');

var db = new sqlite3.Database('celldb.sqlite');

function validate(args) {
  var mcc = args[0], mnc = args[1], lac = args[2], cid = args[3];
  mcc -= 0;
  mnc -= 0;
  lac -= 0;
  cid -= 0;
  if (mcc != mcc || mnc != mnc || lac != lac || cid != cid)
    return false;
  if (mcc < 0 || mnc < 0 || lac < 0 || cid < 0)
    return false;
  if (mcc > 999 || mnc > 2147483647 || lac > 2147483647 || cid > 2147483647)
    return false;
  if (args.length == 4)
    return true;
  if (args.length != 6)
    return false;
  var lat = args[4];
  var lon = args[5];
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
    return false;
  return true;
}

var routing = {
  v1_lookup: function(ok, error, args) {
    if (!validate(args))
      return error("invalid arguments");
    db.get("select * from towers where mcc=? and mnc=? and lac=? order by abs(? - cid) limit 1",
           args, function (err, row) {
             if (err || !row)
               return error("database access failed");
             ok(row);
           });
  },
  v1_update: function(ok, error, args) {
    if (!validate(args) || args.length < 6)
      return error("invalid arguments");
    // this should do some averaging of course
    db.run("insert or ignore into towers values(?, ?, ?, ?, ?, ?, ?, ?)",
           args[0], args[1], args[2], args[3], args[4], args[5], 0.5, 1);
    ok("thanks");
  }
};

http.createServer(function (req, resp) {
  // send a response back to the client
  function response(obj) {
    resp.writeHead(200, {'Content-Type': 'application/json' });
    resp.write(JSON.stringify(obj));
    resp.end();
  }

  // generate an error response
  function error(msg) {
    response({ status: 'error', msg: msg });
  }

  // generate a data response
  function ok(obj) {
    response({ status: 'ok', response: obj });
  }

  var url = req.url;
  var parts = url.split('/');

  console.log(Date.now() + url);

  if (parts[0] != '' || parts[1] != 'api')
    return error('invalid request url');
  if (req.method != 'GET')
    return error('invalid request method');
  var handler = routing[parts[2] + "_" + parts[3]];
  if (!handler)
    return error('invalid request');
  handler.call(this, ok, error, parts.splice(4));
}).listen(8080);
