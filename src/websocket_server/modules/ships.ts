import { FullData, ShipFull, Ships } from '../types/types.js';
import { games } from './database.js';
import { startGame } from './game.js';

export function addShips(data: string) {
  const dataParse = JSON.parse(data);
  const game = games.find((game) => game.id == dataParse.gameId);
  if (!game) return;
  const indexPlayer = game.idPlayers.findIndex(
    (idPlayer) => idPlayer == dataParse.indexPlayer
  );
  game.playerShips[indexPlayer] = dataParse.ships;
  game.workArray[indexPlayer] = createWorkArray(game.playerShips[indexPlayer]);
  console.log(
    `add_ships: Received a list of ships from the player id=${game.idPlayers[indexPlayer]}`
  );

  if (game.playerShips[0] && game.playerShips[1]) startGame(game.id);
}

function createWorkArray(ships: Ships): FullData {
  const fullData: FullData = { ships: [], field: [] };
  if (!ships) return fullData;
  ships.forEach((ship) => {
    const newShip: ShipFull = {
      decks: [],
      roundPoints: [],
      length: ship.length,
    };

    const xMin = ship.position.x - 1;
    const xMax =
      ship.position.x + 1 + (ship.length - 1) * Number(!ship.direction);
    const yMin = ship.position.y - 1;
    const yMax =
      ship.position.y + 1 + (ship.length - 1) * Number(ship.direction);
    for (let y = yMin; y <= yMax; y++)
      for (let x = xMin; x <= xMax; x++)
        if (x == xMin || x == xMax || y == yMin || y == yMax) {
          if (x >= 0 && x < 10 && y >= 0 && y < 10)
            newShip.roundPoints.push({ x, y });
        } else {
          newShip.decks.push({ x, y });
        }
    fullData.ships.push(newShip);
  });

  fullData.field = new Array(10).fill(0);
  fullData.field = fullData.field.map((s) => new Array(10).fill(false));
  fullData.field[2][2] = true;
  return fullData;
}
