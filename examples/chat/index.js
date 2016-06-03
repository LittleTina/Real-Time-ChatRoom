// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;
var users = [];
var onlineClients = {};

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
    console.log("new message added! "+data);
  });

  // when the client emits 'new sticker', this listens and executes
  socket.on('new sticker', function () {
    // we tell the client to execute 'new sticker'
    socket.broadcast.emit('new sticker', {
      username: socket.username
    });
    console.log("new sticker added!");
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    users[numUsers] = username;
    ++numUsers;
    addedUser = true;
    onlineClients[username] = socket;
    socket.emit('login', {
      numUsers: numUsers,
      users:users
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers,
      users: users
    });

    console.log("one user have been added");
    for (i = 0; i < users.length; i++) {
      console.log(users[i]);
    }
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      removeA(users, socket.username);

      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers,
        users:users
      });
    }
    console.log("one user had left");
    for (i = 0; i < users.length; i++) {
      console.log(users[i]);
    }
    /*var clients = io.sockets.clients();
    console.log(clients);*/
  });

  socket.on('pm', function(to, message) {
    var s = onlineClients[to];
    s.emit('receivePM', {
      username: socket.username,
      message: message
    });
  });

});



function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}
