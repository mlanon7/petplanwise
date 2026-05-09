#!/usr/bin/env node
/* ============================================================
   Pet Cost & Vet Bill Calculator — local dev server.
   Zero dependencies. Pure Node built-ins.
   Run:   node local-server.js
   Open:  http://localhost:4173/
   ============================================================ */
"use strict";
var http = require("http");
var fs = require("fs");
var path = require("path");
var url = require("url");

var PORT = Number(process.env.PORT) || 4173;
var ROOT = __dirname;

var MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm":  "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv":  "text/csv; charset=utf-8",
  ".tsv":  "text/tab-separated-values; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".webp": "image/webp",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".pdf":  "application/pdf",
  ".xml":  "application/xml; charset=utf-8",
  ".txt":  "text/plain; charset=utf-8",
  ".map":  "application/json; charset=utf-8"
};

function send(res, status, body, headers) {
  var h = Object.assign({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0"
  }, headers || {});
  res.writeHead(status, h);
  res.end(body);
}

var server = http.createServer(function (req, res) {
  if (req.method === "OPTIONS") return send(res, 204, "");

  var u = url.parse(req.url);
  var p = decodeURIComponent(u.pathname || "/");

  // Block path traversal
  if (p.indexOf("..") >= 0) return send(res, 400, "Bad request");

  // Resolve filesystem path
  var fsp = path.join(ROOT, p);
  fs.stat(fsp, function (err, stat) {
    if (err) {
      // try clean-URL: /foo/  → /foo/index.html (already covered) and /foo → /foo.html
      if (!path.extname(fsp)) {
        var alt = fsp + ".html";
        fs.stat(alt, function (e2, s2) {
          if (e2 || !s2.isFile()) return notFound(res);
          serveFile(res, alt);
        });
        return;
      }
      return notFound(res);
    }
    if (stat.isDirectory()) {
      var idx = path.join(fsp, "index.html");
      fs.stat(idx, function (e3, s3) {
        if (e3 || !s3.isFile()) return notFound(res);
        serveFile(res, idx);
      });
      return;
    }
    serveFile(res, fsp);
  });
});

function serveFile(res, fsp) {
  var ext = path.extname(fsp).toLowerCase();
  var type = MIME[ext] || "application/octet-stream";
  fs.readFile(fsp, function (err, data) {
    if (err) return notFound(res);
    send(res, 200, data, { "Content-Type": type });
  });
}
function notFound(res) {
  var fourOhFour = path.join(ROOT, "404.html");
  fs.readFile(fourOhFour, function (err, data) {
    if (err) return send(res, 404, "Not found", { "Content-Type": "text/plain" });
    send(res, 404, data, { "Content-Type": MIME[".html"] });
  });
}

server.listen(PORT, function () {
  console.log("Pet Cost & Vet Bill Calculator — local dev server");
  console.log("  Root:    " + ROOT);
  console.log("  URL:     http://localhost:" + PORT + "/");
  console.log("  Stop:    Ctrl+C");
});
