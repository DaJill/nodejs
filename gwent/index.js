// var app = require('express')();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);

// app.get('/', function(req, res){
//   res.sendfile('index.html');
// });

// io.on('connection', function(socket){
//   io.emit('some event', { for: 'everyone' });
//   socket.broadcast.emit('hi');
//   socket.on('chat message', function(msg){
//     io.emit('chat message', msg);
//   });
// });

// http.listen(3000, function(){
//   console.log('listening on *:3000');
// });

var Person = require('./self_modules/Person');
var oObj = new Person('Jill', 3);
var sIntroduction = oObj.getIntroduction();
console.log(sIntroduction);