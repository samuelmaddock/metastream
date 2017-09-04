import { ipcMain } from 'electron';
import crypto from 'crypto';

const sessions = new Map();

class Session {
  clients = []

  constructor() {
    this.id = crypto.randomBytes(6).toString('hex');;
  }
}

ipcMain.on('platform-create-lobby', (event, opts) => {
  const session = new Session();
  sessions.set(session.id, session);
  console.log(`Created electron session [${session.id}]`);
  event.sender.send('platform-create-lobby-result', session.id);
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
