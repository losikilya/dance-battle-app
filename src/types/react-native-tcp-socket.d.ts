declare module 'react-native-tcp-socket' {
  import { EventEmitter } from 'events';

  interface Socket extends EventEmitter {
    destroyed: boolean;
    write(data: string | Buffer): void;
    destroy(): void;
    on(event: 'data', listener: (data: Buffer | string) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  interface Server extends EventEmitter {
    listen(options: { port: number; host: string }, callback?: () => void): this;
    close(callback?: () => void): void;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  function createServer(connectionListener?: (socket: Socket) => void): Server;

  export { Socket, Server, createServer };
  export default { createServer };
}
