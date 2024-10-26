import { clients, games } from './database.js';
import { createWorkArray, sendMessage } from './utils.js';

export function addShips(data: string) {
  const dataParse = JSON.parse(data);
  const game = games.find((game) => game.id == dataParse.gameId);
  if (!game) return;
  const indexPlayer = game.idPlayers.findIndex(
    (idPlayer) => idPlayer == dataParse.indexPlayer
  );
  game.playerShips[indexPlayer] = dataParse.ships;
  game.workArray[indexPlayer] = createWorkArray(game.playerShips[indexPlayer]);

  if (game.playerShips[0] && game.playerShips[1]) startGame(game.id);
}

function startGame(idGame: string) {
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
  console.log(`Game with id=${idGame} started`);
}
