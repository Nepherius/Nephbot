var net = require('net')
var auth = require('./chat-packet')
var pack = require('./pack')

var HOST = 'chat.d1.funcom.com'
var PORT = 7105
var DEBUG = 0;

process.on('uncaughtException', function (err) {
	console.log("uncaughtException %s", err)
  console.log(err.stack);
})


//Connect to server & auth
console.log('Attempting Connection to server...')


var s = new net.Socket()
exports.s = s

s.connect(PORT, HOST, function ()
{
	console.log('Connection Established!')
})


exports.handle = {}

var remains = new Buffer(0)

s.on('readable', function ()
{
	var buf = s.read()
	remains = Buffer.concat([remains, buf])
	while (parseChunk(remains));
})

function parseChunk(buf)
{
	var p = auth.parse_packet(buf)

	remains = p.remains
	if (!p.data)
	{
		//console.log('Partial packet');
		return false
	}
	//console.log("Packet type %d", p.type)
	//console.log(p.data.toString('hex'))

	if (p.type in exports.handle)
	{
		exports.handle[p.type](p.data, new pack.Unpacker(p.data))
	}
	else
	{
		//console.log("Unknown packet type %d", p.type)
	//console.log(p.data.toString('hex'))
	}
	return true
}

s.on('end', function ()
{
	console.log('end')
	die()
})


