import { Winner } from '../types/types.js';
import { clients, players, winners } from './database.js';
import { updateRoom } from './rooms.js';
import { sendMessage } from '../utils/utils.js';
import { randomUUID } from 'crypto';

export function regPlayer(idClient: string, data: string) {
  const dataParse = JSON.parse(data);
  let client = clients.find((client) => client.playerName == dataParse.name);
  if (client) {
    const obj = {
      ...dataParse,
      error: true,
      errorText: 'User is already logged in',
    };
    sendMessage(idClient, 'reg', obj);
    console.log(`reg: User ${dataParse.name} is already logged in`);
    return;
  }
  client = clients.find((client) => client.id == idClient);
  if (!client) return;
  const user = players.find((player) => player.name == dataParse.name);
  if (user) {
    if (user.password == dataParse.password) {
      const obj = {
        name: user.name,
        index: user.id,
        error: false,
        errorText: '',
      };
      client.idPlayer = user.id;
      client.playerName = user.name;
      sendMessage(idClient, 'reg', obj);
      console.log(`reg: Player ${user.name} is logged in with id=${user.id}`);
      updateRoom();
      updateWinners();
    } else {
      const obj = {
        name: user.name,
        index: user.id,
        error: true,
        errorText: 'Invalid password',
      };
      sendMessage(idClient, 'reg', obj);
      console.log(`reg: invalid password of ${user.name}`);
    }
  } else {
    const newUser = {
      id: randomUUID(),
      name: dataParse.name,
      password: dataParse.password,
    };
    players.push(newUser);
    const obj = {
      name: newUser.name,
      index: newUser.id,
      error: false,
      errorText: '',
    };
    client.idPlayer = newUser.id;
    client.playerName = newUser.name;
    sendMessage(idClient, 'reg', obj);
    console.log(
      `reg: Player ${dataParse.name} registered and logged in with id=${newUser.id}`
    );
    updateRoom();
    updateWinners();
  }
}

export function updateWinners() {
  clients.forEach((client) =>
    sendMessage(client.id, 'update_winners', winners)
  );
  console.log('update_winners: list of winners has been sent to all players');
}

export function addWinner(name: string) {
  const winner = winners.find((winner) => winner.name == name);
  if (winner) winner.wins++;
  else winners.push({ name, wins: 1 });
  winners.sort(sortFn);
}

function sortFn(a: Winner, b: Winner) {
  if (a.wins != b.wins) return b.wins - a.wins;
  if (a.name < b.name) return -1;
  return 1;
}
