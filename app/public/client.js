var socket = io();
$('button').click(function() {
    if(this.id === 'join') {
        socket.emit('join', $('input').val());
    } else {
        console.log(this.id);
        socket.emit('quiz answer', this.id);
    }
});

socket.on('quiz result', function(msg){
    console.log('message: ' + msg);
});
