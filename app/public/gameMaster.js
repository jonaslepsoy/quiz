/** @jsx React.DOM */
var socket = io();
var players = {};
var playersList = [];

var data = {
    listeners: [],
    subscribe: function(func) {
        this.listeners.push(func);
    },
    unSubscribe: function(func) {
        var index = this.listeners.indexOf(func);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    },
    publish: function(data) {
        this.listeners.forEach(function(listener) {
            listener(data);
        });
    }
};
socket.emit('game master join', true);

socket.on('players', function(players) {
    console.log(players);
    players = players;
    data.publish({players: playersList});
});

socket.on('new player', function(player) {
    console.log(player);
    players[player.username] = player;
    playersList.push(player);
    data.publish({players: playersList});
});

socket.on('start game', function(game) {
    console.log(game);
});

var GameMaster = React.createClass({
    getInitialState: function() {
        return {players: null};
    },
    componentDidMount: function() {
        data.subscribe(this.handleData);
    },
    componentWillUnmount: function() {
        data.unSubscribe(this.handleData);
    },
    handleData: function(data) {
        if(data.players) {
            this.setState({players: data.players});
            console.log(this.state);
        }
    },
    render: function() {
        return (
            <div className="startup col-xs-12 clearfix">
                <div className="qr col-xs-6">
                    <img className="qr-code" src="http://img2.wikia.nocookie.net/__cb20130720012650/despicableme/images/1/18/Minion_dave.jpg"/>
                </div>
                <Players players={this.state.players}/>
            </div>
        );

    }
});

var Players = React.createClass({
    render: function() {
        var players = [];
        if(this.props.players) {
            players = this.props.players.map(function(player) {
                return <Player player={player} />;
            });
        }
        return (
            <div className="players col-xs-6">
                <ul className="player-list list-unstyled">
                    {players}
                </ul>
            </div>
        );
    }
});

var Player = React.createClass({
    render: function() {
        return <li className="player">{this.props.player.username}</li>;
    }
});

React.renderComponent(<GameMaster/>, document.getElementById('content'));
