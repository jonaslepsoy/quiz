/** @jsx React.DOM */
var socket = io();

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

socket.on('quiz result', function(msg){
    console.log('message: ' + msg);
});

socket.on('ready?', function(mesg) {
    data.publish({mode: 'ready'});
});

socket.on('wait', function(msg) {
    data.publish({mode: 'wait'});
});

socket.on('next game', function(gameType) {
    console.log('gameType: ' + gameType);
    data.publish({mode: gameType});
});

var Join = React.createClass({
    getInitialState: function() {
        return {name: null};
    },
    handleNameChanged: function(e) {
        var name = e.target.value;
        console.log(name);
        this.setState({name: name});
        e.preventDefault();
    },
    handleOnSubmit: function(e) {
        if(this.state.name) {
            socket.emit('join', this.state.name);
        }
    },
    render: function() {
        var name = this.state.name;
        return (
            <div className="login-screen">
                <div className="input-group center">
                    <label htmlFor="username" className="label">Velg ditt brukernavn: </label>
                    <input id="username" className="username form-control" type="text" placeholder="Brukernavn" value={name} onChange={this.handleNameChanged}/>
                    <span className="input-group-btn">
                        <button id="join" type="button" className="btn btn-primary" onClick={this.handleOnSubmit}>GO!</button>
                    </span>
                </div>
            </div>
        );
    }
});

var Ready = React.createClass({
    handleReady: function(e) {
        socket.emit('ready', true);
        data.publish({mode: 'wait'});
    },
    render: function() {
        return (
            <div className="login-screen">
                <div className="input-group center">
                    <button id="ready" type="submit" className="btn btn-primary btn-lg" onClick={this.handleReady}>Ready!</button>
                </div>
            </div>
        );
    }
});

var Waiting = React.createClass({
    render: function() {
        return (
            <div className="waiting-screen">
                <div class="page-header center">
                    <h1>Waiting</h1>
                </div>
            </div>
        );
    }
});

var Next = null;

var Quiz = React.createClass({
    handleClick: function(e) {
        var color = e.target.id;
        socket.emit('quiz answer', color);
        data.publish({mode: 'wait'});
    },
    render: function() {
        return (
            <div className="alternatives">
                <div className="button-group">
                    <button id="red" className="col-xs-6" onClick={this.handleClick}>Red</button>
                    <button id="green" className="col-xs-6" onClick={this.handleClick}>Green</button>
                    <button id="blue" className="col-xs-6" onClick={this.handleClick}>Blue</button>
                    <button id="yellow" className="col-xs-6" onClick={this.handleClick}>Yellow</button>
                </div>
            </div>
        );
    }
});

var PsychOut = React.createClass({
   handleClick: function(e){
       socket.emit('psych out answer', true);
       data.publish({mode: 'wait'});
   },
    render: function(){
        return <button className="col-xs-12" onClick={this.handleClick}></button>
    }
});


var GameClient = React.createClass({
    modes: {
        join: <Join />,
        ready: <Ready />,
        wait: <Waiting />,
        quiz: <Quiz />
    },
    selectMode: function(mode) {
        var modeComponent = this.modes[mode];
        if(!modeComponent) {
            modeComponent = modes.waiting;
        }
        return modeComponent;
    },
    getInitialState: function() {
        return {mode: 'join'};
    },
    componentDidMount: function() {
        data.subscribe(this.handleData);
    },
    componentWillUnmount: function() {
        data.unSubscribe(this.handleData);
    },
    handleData: function(data) {
        if(data.mode) {
            this.setState({mode: data.mode});
        }
    },
    render: function() {
        var mode = this.selectMode(this.state.mode);
        return (
            <div>
                {mode}
            </div>
        );
    }
});

React.renderComponent(<GameClient/>, document.getElementById('content'));
