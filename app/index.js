var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var players = {};
var playerCount = 0;
var ready = 0;

var psychOut = function(username) {

};

var quiz = function(answer) {
    if(answer === 'red') {
        return true;
    }
    return false;
};

var quizGame = {
    type: "quiz",
    text: "bsffldskgjsødlfgjsødlfjg sfdglkj",
    mediaUrl: "",
    alternatives: [],
    checkAnswer: quiz
};

var psychOutGame = {
    type: "psychOut",
    text: "Don't push the button first or last",
    checkAnswer: psychOut
};

var party = [quizGame, psychOutGame];
var game = null;
var gameNumber = 0;

var gameMaster = null;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res){
    res.sendfile('static/index.html');
});

app.get('/gameMaster/', function(req, res){
    res.sendfile('static/gameMaster.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        playerCount--;
        console.log('user disconnected');
    });

    socket.on('game master join', function(msg) {
        if(!gameMaster) {
            gameMaster = socket;
        }
    });

    socket.on('join', function(username){
        socket.username = username;
        var player = {
            username: username,
            score: 0
        };
        players[username] = player;
        playerCount++;
        console.log(player);
    });

    socket.on('quiz answer', function(msg){
        if(!socket.username) return;
        player = players[socket.username];
        console.log(player.username + ': ' + msg);
        quizResult = party[0].checkAnswer(msg);
        if(quizResult) {
            player.score++;
        }
        socket.emit('quiz result', quizResult);
    });

    socket.on('psych out answer', function(msg){
        if(!socket.username) return;
        player = players[socket.username];
        console.log(player.username + ': ' + msg);
        party[1].checkAnswer(player.username);
    });

    socket.on('next', function() {
        if(!socket.username) return;
        player = players[socket.username];
        ready++;
        if(ready >= playersCount) {
            game = party[gameNumber++];
            if(game) {
                socket.broadcast.emit("next game", game.type);
                gameMaster.emit('start game', game);
            } else {
                socket.broadcast.emit("game over", players);
            }
        }
    });
});

http.listen(8080, function(){
    console.log('listening on *:8080');
});
