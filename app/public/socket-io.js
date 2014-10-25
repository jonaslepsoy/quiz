var socket = io();
$('button').onClick(function(el) {
    socket.emit('chat message', el.id);
});
