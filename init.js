#!/usr/bin/env node

var asarReader = require('asar-reader')
var minimist = require('minimist')
var path = require('path')
var http = require('http')
var url = require('url')
var mime = require('mime')

var argv = require('minimist')(process.argv.slice(2));
var asarPaths = {};

var asarFile = argv._[0];

if (! asarFile) {
	console.log("usage: "+process.argv[0]+" [asar file]")
	process.exit(1)
}

var asar = asarReader(asarFile, { keepOpenFor: 2000 })

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
        headers['content-type'] = mime.lookup(pathname == '/' ? 'index.html' : pathname);
	
	res.writeHead(200, headers)

	asar.readFile(found, function(err, buf) {
		if (err) {
			console.error(err)
			res.writeHead(500)
			res.end('internal server error')
			return
		}
		res.end(buf)
	})
})


asar.listFiles(function(err, files) {
	if (err) throw err

	asarPaths = files
	asarPaths['/'] = asarPaths['/index.html']

	server.listen(port, (err) => {  
		if (err) {
			console.error(err)
			process.exit(1)
		}

		console.log('asar-server is listening on '+port)
	})
})
