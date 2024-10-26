import { clients, players } from './database.js';
import { updateRoom } from './roomCommands.js';
import { sendMessage } from './utils.js';
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
      console.log(`reg: User ${user.name} is logged in with id=${user.id}`);
      updateRoom();
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
      `reg: User ${dataParse.name} registered and logged in with id=${newUser.id}`
    );
    updateRoom();
  }
}
