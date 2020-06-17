import * as colors from 'colors/safe';
import * as moment from 'moment';
import { Zqs } from './app';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'typed-promisify';
import * as IO from 'socket.io';
import * as redis from 'socket.io-redis';

let io: SocketIO.Server;

/**
 * Socket class
 *
 * To use this, just create a file named socket.ts in your api directory.
 * Paste following code to the file
 * ```ts
 * import { Socket } form '@zqs/core/lib/socket';
 *
 * export default new Socket('room_name_here');
 * ```
 *
 * To emit a event
 * ```ts
 * import socket from './socket';
 * socket.emit('event:name', 'some text');
 * ```
 */
export class Socket {
  private room: string;

  /**
   * Creating a socket object
   * @param room {string} room name
   */
  constructor(room: string) {
    this.room = room;
  }

  /**
   * Adding socket to the room
   * @param socket {SocketIO.Socket} socket
   */
  public register(socket: SocketIO.Socket): void {
    socket.join(this.room);
  }

  /**
   * Emitting event to all members in the room
   * @param event {string} event name
   * @param args {any[]} something
   */
  public emit(event: string, ...args: any[]) {
    io.of('/')
      .to(this.room)
      .emit(event, ...args);
  }
}

export async function setup(app: Zqs) {
  if (!app.config.socket) return;
  const config: IConfig = app.config.socket;
  const apiDir = path.join(app.dir, 'api');
  const dirs = await promisify(fs.readdir)(apiDir);
  const sockets: Socket[] = [];
  for (const dir of dirs) {
    if (/^\./.test(dir)) continue;
    try {
      const stat = await promisify(fs.stat)(`${apiDir}/${dir}/socket.js`);
      if (stat.isFile) {
        const socket: Socket = require(`${app.dir}/api/${dir}/socket`).default;
        sockets.push(socket);
      }
    } catch (e) {
      continue;
    }
  }

  const port = config.startPort + ~~process.env.pm_id;
  io = IO(port);
  io.adapter(redis(config.redis));
  io.on('connection', socket => {
    if (config.onConnection) config.onConnection(socket);
    if (config.onDisconnect) {
      socket.on('disconnect', () => {
        config.onDisconnect(socket);
      });
    }
    for (const s of sockets) {
      s.register(socket);
    }
  });
  console.log(
    `[${colors.green(
      moment().format('YY-MM-DD HH:mm:ss')
    )}] Socket IO started at http://${app.config.domain}:${port}`
  );
}

export interface IConfig {
  /**
   * Socket first port.
   * If you run app in pm2 with 4 cores, the actual ports will be startPort, startPort + 1, startPort + 2, startPort + 3
   */
  startPort: number;

  /**
   * redis options
   */
  redis: redis.SocketIORedisOptions;

  /**
   * Doing some stuff on connection
   */
  onConnection?: (socket: SocketIO.Socket) => void;

  /**
   * Doing some stuff on disconnect
   */
  onDisconnect?: (socket: SocketIO.Socket) => void;
}
