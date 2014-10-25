var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var lodash = require('lodash');
var fs = require('fs');

var players = [];
var scoreboard = {};
var ready = [];
var gameNumber = 0;
var minPlayers = 4;
var gameMaster = null;
var party = JSON.parse(fs.readFileSync(path.join(__dirname, 'static/party.json'), 'utf8'));
var currentGame = {};
var gameInProgress = false;

var psychOut = function(username) {

};

var quiz = function(answer) {
    var result = lodash.where(this.alternatives, function(alternative) {
        var r = alternative.color === answer && alternative.valid;
        console.log(answer + ": " + r + " (color: " + alternative.color + " valid: " + alternative.valid + ")");
        return r;
    });
    return result.length > 0;
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

var leave = function(socket) {
        if(!socket.username) { return; }
        player = scoreboard[socket.username];
        if(player) {
            delete scoreboard[player.username];
        }
        players = lodash.where(players, function(p) {
            return p.username !== player.username;
        });
        console.log(players);
        console.log('user disconnected');
};

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        leave(socket);
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

    socket.on('leave', function() {
        console.log(socket.username + ": leave");
        leave(socket);
    });

    socket.on('join', function(username){
        if(gameInProgress) return;
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
        if(!player) return;
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
        if(!player) return;
        console.log(player.username + ': ' + msg);
        if(currentGame.game.checkAnswer(msg)) {
            currentGame.winners.push(player);
        } else {
            currentGame.loosers.push(player);
        }
        if((currentGame.winners.length + currentGame.loosers.length) === players.length) {
            currentGame.score();
            gameMaster.emit('update scoreboard', {currentGame: currentGame, players: players});
            io.sockets.emit('next?', true);
        }
    });

    socket.on('psych out answer', function(msg){
        if(!socket.username) return;
        player = scoreboard[socket.username];
        if(!player) return;
        console.log(player.username + ': ' + msg);
        currentGame.game.checkAnswer(player.username);
    });

    socket.on('next', function() {
        nextGame(socket);
    });
});

var chooseGame = function() {
    var game = party.games[gameNumber++];
    if(!game) {
        return null;
    }
    return {
                game: game,
                winners: [],
                loosers: [],
                score: function() {
                    this.winners.forEach(function(winner) {
                        winner.score++;
                    });
                }
            };
};

var nextGame = function(socket) {
    if(!socket.username) return;
    player = scoreboard[socket.username];
    if(!player) return;
    ready.push(player);
    console.log('ready count: ' + ready.length + ' (minPlayers: ' + minPlayers + ', playerCount: ' + players.length + ')');
    if(ready.length >= minPlayers && ready.length === players.length) {
        ready = [];
        currentGame = chooseGame();
        if(currentGame) {
            gameInProgress = true;
            console.log('start game: ' + currentGame.game.type);
            io.sockets.emit('next game', currentGame.game.type);
            gameMaster.emit('start game', currentGame);
        } else {
            gameInProgress = false;
            gameNumber = 0;
            console.log('party is over');
            console.log(players);
            io.sockets.emit("game over", players);
        }
    } else {
        console.log(socket.username + ': wait');
    }
};

http.listen(8080, function(){
    console.log('listening on *:8080');
});
