import * as colors from 'colors/safe';
import * as spdy from 'spdy';
import * as moment from 'moment';
import { Zqs } from './app';

export async function setup(app: Zqs): Promise<Boolean> {
  if (!app.config.spdy) return false;
  spdy
    .createServer(app.config.spdy.options, app.callback())
    .listen(app.config.spdy.port);
  console.log(
    `[${colors.green(
      moment().format('YYYY-MM-DD HH:mm:ss')
    )}]  HTTPS Server started at https://${app.config.domain}:${
      app.config.spdy.port
    }`
  );
  return true;
}

export interface IConfig {
  /**
   * spdy server options
   */
  options: spdy.server.ServerOptions;

  /**
   * https port
   */
  port: number;
}
