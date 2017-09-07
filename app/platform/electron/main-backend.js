import { ipcMain, webContents } from 'electron';
import crypto from 'crypto';

const sessions = new Map();

class Session {
  clients = new Set()

  constructor() {
    this.id = crypto.randomBytes(6).toString('hex');

    ipcMain.on(`platform-lobby-message-${this.id}`, this.receive);
  }

  close() {
    ipcMain.removeListener(`platform-lobby-message-${this.id}`, this.receive);
  }

  receive = (event, msg) => {
    console.log(`[Session.receive][${this.id}] Received '${msg}' from ${event.sender.id}`);
  }

  join(client) {
    this.clients.add(client.id);
  }

  leave(client) {
    this.clients.delete(client.id);
  }

  sendTo(id, msg) {
    const client = webContents.fromId(id);
    client.send('platform-lobby-message', msg);
  }

  isEmpty() {
    return this.clients.size === 0;
  }
}

ipcMain.on('platform-create-lobby', (event, opts) => {
  const { sender } = event;

  const session = new Session();
  session.join(sender);

  sessions.set(session.id, session);

  console.log(`Created electron session [${session.id}]`);
  sender.send('platform-create-lobby-result', session.id);
});

ipcMain.on('platform-join-lobby', (event, lobbyId) => {
  const { sender } = event;
  const session = sessions.get(lobbyId);
  if (!session) {
    console.error(`[platform-join-lobby] No session found for '${lobbyId}'`);
    sender.send('platform-join-lobby-result', false);
    return;
  }

  session.join(sender);
  sender.send('platform-join-lobby-result', true);
});

ipcMain.on('platform-leave-lobby', (event, lobbyId) => {
  const { sender } = event;
  const session = sessions.get(lobbyId);
  if (!session) {
    console.error(`[platform-leave-lobby] No session found for '${lobbyId}'`);
    sender.send('platform-leave-lobby-result', false);
    return;
  }

  session.leave(sender);

  if (session.isEmpty()) {
    session.close();
    sessions.delete(session.id);
  }
});

ipcMain.on('platform-query', (event, opts) => {
  const results = Array.from(sessions).map(session => {
    return {
      name: 'Electron Lobby Foo',
      id: session.id,
      data: {
        foo: 'bar'
      }
    }
  });

  event.sender.send('platform-query-result', results);
});
