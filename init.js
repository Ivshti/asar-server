#!/usr/bin/env node

var asar = require('asar-lite-stremio')
var minimist = require('minimist')
var path = require('path')
var http = require('http')
var url = require('url')

var argv = require('minimist')(process.argv.slice(2));
var asarPaths = {};

var asarFile = argv._[0];

if (! asarFile) {
	console.log("usage: "+process.argv[0]+" [asar file]")
	process.exit(1)
}

asar.listPackage(asarFile).forEach(function(p) { asarPaths[p.split(path.sep).join('/')] = p })
asarPaths['/'] = '/index.html'

var port = argv.p || argv.port || 8080
var cache = argv.c | argv.cache || 60

var server = http.createServer(function(req, res) {
	var pathname = url.parse(req.url).pathname
	var found = asarPaths[pathname]

	console.log(req.method + " " + pathname + " -> "+(found ? 200 : 404))

	if (! found) {
		res.writeHead(404)
		res.end('not found')
		return
	}

	var headers = { }

	if (cache) headers['cache-control'] = 'max-age='+cache

	res.writeHead(200, headers)
    res.end(asar.extractFile(asarFile, found.substring(1)))
})

server.listen(port, (err) => {  
	if (err) {
		console.error(err)
		process.exit(1)
	}

	console.log('asar-server is listening on '+port)
})
