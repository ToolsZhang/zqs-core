import * as colors from 'colors/safe';
import * as moment from 'moment';
import { Zqs } from './app';
import { Mongoose } from './db';
import { ConnectionOptions } from 'mongoose';

export function setup(app: Zqs) {
  Mongoose.Promise = app.config.mongodb.promise;
  console.log(
    `[${colors.green(
      moment().format('YY-MM-DD HH:mm:ss')
    )}] Trying to connect MongoDB.`
  );

  Mongoose.connect(app.config.mongodb.uri, app.config.mongodb.options);

  Mongoose.connection.on('connected', () => {
    console.log(
      `[${colors.green(
        moment().format('YY-MM-DD HH:mm:ss')
      )}] MongoDB connected.`
    );
  });

  Mongoose.connection.on('disconnected', () => {
    console.log(
      `[${colors.yellow(
        moment().format('YY-MM-DD HH:mm:ss')
      )}] MongoDB disconnected.`
    );
  });

  Mongoose.connection.on('error', err => {
    console.log(
      `[${colors.red(
        moment().format('YY-MM-DD HH:mm:ss')
      )}] MongoDB error: ${err}`
    );
    process.exit(-1);
  });
}

export interface IConfig {
  /**
   * mongoose uri
   */
  uri: string;

  /**
   * mongoose connection options
   */
  options: ConnectionOptions;

  /**
   * mongoose promise
   */
  promise: any;
}
