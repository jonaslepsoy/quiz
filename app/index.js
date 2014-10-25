var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var lodash = require('lodash');
var fs = require('fs');

var players = [];
var scoreboard = {};
var playerCount = 0;
var ready = 0;
var gameNumber = 0;
var minPlayers = 2;
var gameMaster = null;
var party = JSON.parse(fs.readFileSync(path.join(__dirname, 'static/party.json'), 'utf8'));
var currentGame = {};

var psychOut = function(username) {

};

var quiz = function(answer) {
    var result = lodash.first(this.alternatives, function(alternative) {
        return alternative.color === answer && alternative.valid;
    });
    return result !== null;
};

var checkAnswers = {
    quiz: quiz,
    psychOut: psychOut
};

party.games.forEach(function(game) {
    game.checkAnswer = checkAnswers[game.type];
});

var gameNumber = 0;
var minPlayers = 1;


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
        if(!gameMaster) {
            socket.emit('join', true);
            return;
        }
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
        if(currentGame.game.checkAnswer(msg)) {
            player.score++;
            currentGame.winners.push(player);
        } else {
            currentGame.loosers.push(player);
        }
        if((currentGame.winners.length + currentGame.loosers.length) === playerCount) {
            gameMaster.emit('update scoreboard', {currentGame: currentGame, players: players});
            io.sockets.emit('next?', true);
        }
    });

    socket.on('psych out answer', function(msg){
        if(!socket.username) return;
        player = scoreboard[socket.username];
        console.log(player.username + ': ' + msg);
        currentGame.game.checkAnswer(player.username);
    });

    socket.on('next', function() {
        nextGame(socket);
    });
});

var chooseGame = function() {
    return {
                game: party.games[gameNumber++],
                winners: [],
                loosers: []
            };
};

var nextGame = function(socket) {
    if(!socket.username) return;
    player = scoreboard[socket.username];
    ready++;
    console.log('ready count: ' + ready + ' (minPlayers: ' + minPlayers + ', playerCount: ' + playerCount + ')');
    if(ready >= minPlayers && ready === playerCount) {
        ready = 0;
        currentGame = chooseGame();
        if(currentGame) {
            console.log('start game: ' + currentGame.game.type);
            io.sockets.emit('next game', currentGame.game.type);
            gameMaster.emit('start game', currentGame);
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
