import {createServer, Props} from '@krmx/server';
import {enableOfflineKicker} from './offline-kicker';
import {type} from 'os';

const props: Props = { /* configure here */};
const server = createServer(props);

interface Tile {
    content: string;
}

interface Player {
    gridIndex: number;
}


type Move = "up" | "down" | "right" | "left" | "none"

var gridWidth = 5;
var gridHeight = 5;
var worldGrid: Tile[] = [];
var gameLoopTime: number = 5000;
var moves: Record<string, Move> = {};
var players: Record<string, Player> = {};
// var players: Player[] = [];
var direction: Record<Move, number> = {
    'up': -gridWidth,
    'down': gridWidth,
    'left': -1,
    'right': 1,
    'none': 0,
}

//setup the world grid, by default all Empty
for (var i = 0; i < gridWidth; i++) {
    for (var j = 0; j < gridHeight; j++) {
        var tile: Tile = {content: 'empty'}
        worldGrid.push(tile);
    }
}

server.on('leave', (username) => {
    worldGrid[players[username].gridIndex].content = 'empty';
    server.broadcast({type: 'ao/grid', payload: worldGrid})
});

server.on('join', (username) => {
    let player: Player = {
        gridIndex: worldGrid.findIndex(w => w.content == 'empty')
    };

    players[username] = player;
    worldGrid[player.gridIndex].content = `player:${username}`;

    server.broadcast({type: 'ao/grid', payload: worldGrid}, username);
});


server.on('link', (username) => {
    server.send(username, {type: 'ao/grid-size', payload: {width: gridWidth, height: gridHeight}})
    server.send(username, {type: 'ao/grid', payload: worldGrid})

});

server.on('message', (username, message) => {
    console.log(username)
    console.log(message)

    if (message.type === 'chat/message') {
        server.broadcast({type: 'chat/messaged', payload: {username, text: message.payload}});
    }

    //Receive move commands from players
    if (message.type === 'ao/move') {
        moves[username] = message.payload as Move;
        server.send(username, {type: "ao/move-confirmed", payload: message.payload})
    }
});

function doGameLoop() {
    for (const userName in moves) {
        let move = moves[userName];
        let player = players[userName];
        if (player === undefined) {
            console.log("move found for non existing player" + userName);
            continue;
        }

        let playerIndex = player?.gridIndex as number;
        let modulesRemainder = playerIndex % gridWidth;

        //Outside grid, do not move
        if ((move === 'up' && playerIndex - gridWidth < 0)
            || (move === 'down' && playerIndex + gridWidth >= worldGrid.length)
            || (move === 'left' && modulesRemainder === 0)
            || (move === 'right' && modulesRemainder === (gridWidth - 1))) {
            console.log(`${userName} moves outside grid, do nothing`);
            server.send(userName, {type: "ao/move-denied", payload: "out-of-grid"})
            continue;
        }
        
        let targetIndex = player.gridIndex + direction[move];

        //is tile available?
        if (worldGrid[targetIndex].content === 'empty') {
            worldGrid[player.gridIndex].content = 'empty';
            player.gridIndex += direction[move];
            worldGrid[player.gridIndex].content = `player:${userName}`;
            console.log(`player ${userName} moved to ${player.gridIndex}`);
        } else {
            server.send(userName, {type: "ao/move-denied", payload: "obstruction"})
        }
        
    }

    //reset the moves
    moves = {};
    
    //Update the world
    server.broadcast({type: 'ao/grid', payload: worldGrid});
    server.broadcast({type: 'ao/game-loop', payload: gameLoopTime});
}

setInterval(doGameLoop, gameLoopTime);

server.listen(8082);
export default async () => server.close();
