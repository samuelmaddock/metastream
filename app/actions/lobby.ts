import { Thunk } from "types/thunk";
import SimplePeer from "simple-peer";

let p: SimplePeer.Instance;

export const createLobby = (): Thunk<void> => {
  return (dispatch, getState) => {
    console.log('Creating P2P lobby...');

    p = new SimplePeer({
      initiator: false
    });

    p.on('error', err => {
      console.log('peer error', err);
    });

    p.on('connect', () => {
      console.log('peer connect');
    });

    p.on('data', data => {
      console.log('peer data', data);
    });

    p.on('signal', (data: any) => {
      console.log('peer signal', data);
    });
  };
};

export const leaveLobby = (): Thunk<void> => {
  return (dispatch, getState) => {
    if (!p) { return; }

    console.log('Closing p2p connection');

    p.destroy();
  };
};

