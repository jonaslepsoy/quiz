var socket = io();

socket.on('start game', function(game) {
    console.log(game);
});
