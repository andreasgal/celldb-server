/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var fs = require('fs'),
    lazy = require('lazy'),
    sqlite3 = require('sqlite3');

var db = new sqlite3.Database('celldb.sqlite');

function x(stmt) {
  db.run(stmt);
}

db.serialize(function () {
  x('pragma synchronous=OFF;');
  x('pragma count_changes=OFF;');
  x('pragma journal_mode=MEMORY;');
  x('pragma temp_store=MEMORY;');
  x('drop table if exists towers;');
  x('create table towers (mcc integer, mnc integer, lac integer, cid integer, lat double, lon double, range double, measurements integer);');
  x('create index mcc_mnc_lac_cid on towers(mcc,mnc,lac,cid);');
  x('create index mcc_mnc_lac on towers(mcc,mnc,lac);');
  new lazy(fs.createReadStream('basestations.csv')).lines.forEach(function (line) {
    var fields = line.toString().split(";");
    var lat = fields[2] - 0;
    var lon = fields[3] - 0;
    var mcc = fields[4] | 0;
    var mnc = fields[5] | 0;
    var lac = fields[6] | 0;
    var cid = fields[7] | 0;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.error(line.toString());
      return;
    }
    var range = 0.5; // 500ft default distance
    var measurements = 1;
    x('insert into towers values (' + [mcc, mnc, lac, cid, lat, lon, range, measurements].join(',') + ');');
  });
});

