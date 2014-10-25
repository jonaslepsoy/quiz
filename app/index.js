var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var lodash = require('lodash');

var players = [];
var scoreboard = {};
var playerCount = 0;
var ready = 0;

var psychOut = function(username) {

};

var quiz = function(answer) {
    var result = lodash.first(this.alternatives, function(alternative) {
        return alternative.color === answer && alternative.valid;
    });
    return result !== null;
};

var quizGame = {
    type: "quiz",
    question: "bsffldskgjsødlfgjsødlfjg sfdglkj",
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
var gameNumber = 0;
var minPlayers = 2;

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
        if(playerCount < 0) {
            playerCount = 0;
        }
        console.log('user disconnected');
    });

    socket.on('game master join', function(msg) {
        gameMaster = socket;
        gameMaster.emit('players', {
            minPlayers: minPlayers,
            readyPlayers: ready,
            players: players
        });
        console.log('game master joined');
    });

    socket.on('join', function(username){
        socket.username = username;
        var player = {
            username: username,
            score: 0,
            ready: false
        };
        scoreboard[username] = player;
        players.push(player);
        playerCount++;
        if(gameMaster) {
            gameMaster.emit('new player', {
                newPlayer: player,
                minPlayers: minPlayers,
                readyPlayers: ready,
                players: players
            });
        }
        socket.emit('ready?', true);
        console.log(player);
    });

    socket.on('ready', function() {
        if(!socket.username) return;
        console.log(socket.username + ": " + 'ready');
        var player = scoreboard[socket.username];
        player.ready = true;
        nextGame(socket);
        if(gameMaster) {
            gameMaster.emit('ready', {
                newPlayer: player,
                minPlayers: minPlayers,
                readyPlayers: ready,
                players: players
            });
        }
    });

    socket.on('quiz answer', function(msg){
        if(!socket.username) return;
        player = scoreboard[socket.username];
        console.log(player.username + ': ' + msg);
        quizResult = party[0].checkAnswer(msg);
        if(quizResult) {
            player.score++;
        }
        socket.emit('quiz result', quizResult);
    });

    socket.on('psych out answer', function(msg){
        if(!socket.username) return;
        player = scoreboard[socket.username];
        console.log(player.username + ': ' + msg);
        party[1].checkAnswer(player.username);
    });

    socket.on('next', function() {
        nextGame(socket);
    });
});

var chooseGame = function() {
    return party[gameNumber++];
};

var nextGame = function(socket) {
    if(!socket.username) return;
    player = scoreboard[socket.username];
    ready++;
    console.log('ready count: ' + ready + ' (minPlayers: ' + minPlayers + ', playerCount: ' + playerCount + ')');
    if(ready >= minPlayers && ready === playerCount) {
        ready = 0;
        game = chooseGame();
        if(game) {
            console.log('start game: ' + game.type);
            io.sockets.emit('next game', game.type);
            gameMaster.emit('start game', game);
        } else {
            console.log('party is over');
            socket.broadcast.emit("game over", players);
        }
    } else {
        console.log(socket.username + ': wait');
    }
};

http.listen(8080, function(){
    console.log('listening on *:8080');
});
