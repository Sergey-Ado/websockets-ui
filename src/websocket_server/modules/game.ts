import { FullData, Game, Point, ResOfShot } from '../types/types.js';
import { botAttack } from './bot.js';
import { clients, games, players } from './database.js';
import { addWinner, updateWinners } from './player.js';
import { sendMessage } from './utils.js';

export function startGame(idGame: string) {
  const game = games.find((game) => game.id == idGame);
  if (!game) return;
  game.idPlayers.forEach((idPlayer, index) => {
    const idClient = clients.find((client) => client.idPlayer == idPlayer)?.id;
    if (!idClient) return;
    const obj = {
      ships: game.playerShips[index],
      currentPlayerIndex: idPlayer,
    };
    sendMessage(idClient, 'start_game', obj);
  });
  console.log(
    `start_game: Game id=${idGame} started with player id=${game.idPlayers[0]} and player id=${game.idPlayers[1]}`
  );
  sendTurn(game);
}

export async function attack(idClient: string, data: string) {
  const idPlayer = clients.find((client) => client.id == idClient)?.idPlayer;
  if (!idPlayer) return;
  const game = games.find((game) => game.idPlayers.includes(idPlayer));
  if (!game) return;
  if (game.botStep) return;
  if (idPlayer != game.idPlayers[game.currentPlayer]) return;

  let x: number;
  let y: number;
  const indexEnemy = (game.currentPlayer + 1) % 2;
  const dataParse = JSON.parse(data);
  let command = '';
  if (dataParse.x != undefined && dataParse.y != undefined) {
    x = dataParse.x;
    y = dataParse.y;
    command = 'attack';
  } else {
    const freePoints: Point[] = [];
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 10; j++)
        if (!game.workArray[indexEnemy].field[i][j])
          freePoints.push({ x: j, y: i });
    const indexRandomPoint = Math.floor(Math.random() * freePoints.length);
    x = freePoints[indexRandomPoint].x;
    y = freePoints[indexRandomPoint].y;
    command = 'randomAttack';
  }

  if (game.workArray[indexEnemy].field[y][x]) {
  } else {
    const resShot = shot(game.workArray[indexEnemy], x, y);
    game.workArray[indexEnemy].field[y][x] = true;
    switch (resShot.res) {
      case 'miss': {
        const obj = {
          position: { x, y },
          currentPlayer: idPlayer,
          status: 'miss',
        };
        sendMessageAllPlayer(game, 'attack', obj);
        if (game.idPlayers[1] == '') {
          game.botStep = true;
          if (await botAttack(game)) return;
          game.botStep = false;
          if (game.workArray[0].ships.length == 0) return;
        } else {
          game.currentPlayer = (game.currentPlayer + 1) % 2;
        }
        console.log(`${command}: Player id=${idPlayer} missed`);
        sendTurn(game);
        break;
      }
      case 'shot': {
        const obj = {
          position: { x, y },
          currentPlayer: idPlayer,
          status: 'shot',
        };
        sendMessageAllPlayer(game, 'attack', obj);
        console.log(`${command}: Player id=${idPlayer} shot`);
        sendTurn(game);
        break;
      }
      case 'killed': {
        const ship = game.workArray[indexEnemy].ships[resShot.indexShip];
        for (let deck of ship.decks) {
          const obj = {
            position: deck,
            currentPlayer: idPlayer,
            status: 'killed',
          };
          sendMessageAllPlayer(game, 'attack', obj);
        }

        for (let roundPoint of ship.roundPoints) {
          const obj = {
            position: roundPoint,
            currentPlayer: idPlayer,
            status: '',
          };
          sendMessageAllPlayer(game, 'attack', obj);
          game.workArray[indexEnemy].field[roundPoint.y][roundPoint.x] = true;
        }

        console.log(`${command}: Player id=${idPlayer} killed`);
        game.workArray[indexEnemy].ships.splice(resShot.indexShip, 1);

        if (!game.workArray[indexEnemy].ships.length) {
          const obj = {
            winPlayer: idPlayer,
          };
          sendMessageAllPlayer(game, 'finish', obj);

          console.log(`finish: Player id=${idPlayer} won`);
          console.log(`finish: Game id=${game.id} deleted`);
          const name = players.find((player) => player.id == idPlayer)?.name;
          if (name) {
            addWinner(name);
            updateWinners();
          }
          const indexGame = games.findIndex((s) => s.id == game.id);
          games.splice(indexGame, 1);
          return;
        }
        sendTurn(game);
        break;
      }
    }
  }
}

function shot(enemyWorkArray: FullData, x: number, y: number): ResOfShot {
  for (let i = 0; i < enemyWorkArray.ships.length; i++)
    for (let deck of enemyWorkArray.ships[i].decks)
      if (deck.x == x && deck.y == y) {
        enemyWorkArray.ships[i].length--;
        if (enemyWorkArray.ships[i].length)
          return { res: 'shot', indexShip: i };
        return { res: 'killed', indexShip: i };
      }
  return { res: 'miss', indexShip: -1 };
}

export function sendTurn(game: Game) {
  const idCurrentPlayer = game.idPlayers[game.currentPlayer];
  const obj = { currentPlayer: idCurrentPlayer };
  sendMessageAllPlayer(game, 'turn', obj);
  console.log(`turn: Player id=${idCurrentPlayer} moves`);
}

function sendMessageAllPlayer(game: Game, type: string, obj: unknown) {
  game.idPlayers.forEach((idPlayer) => {
    const idClient = clients.find((client) => client.idPlayer == idPlayer)?.id;
    if (!idClient) return;
    sendMessage(idClient, type, obj);
  });
}
