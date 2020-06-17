import * as colors from 'colors/safe';
import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import { promisify } from 'typed-promisify';
import { Zqs } from './app';
import { Router } from './routers';

export let routers: Router[] = [];

export async function setup(app: Zqs, mode: 'pre' | 'post') {
  const pluginsDir = path.join(app.dir, 'plugins');
  try {
    if (!fs.existsSync(pluginsDir)) return;
    const files = await promisify(fs.readdir)(pluginsDir);
    for (const fileName of files) {
      if (/^\./.test(fileName)) continue;
      if (!/\.js$/.test(fileName)) continue;
      const stat = await promisify(fs.stat)(`${pluginsDir}/${fileName}`);
      if (stat.isFile()) {
        const plugin = require(`zqs-plugin-${fileName.substring(
          0,
          fileName.length - 3
        )}`);
        const fn = plugin.setup[mode];
        if (fn) {
          const pluginRouters: Router[] = await fn(app);
          if (mode === 'pre' && pluginRouters)
            routers = routers.concat(pluginRouters);
        }
      }
    }
  } catch (e) {
    console.log(
      `[${colors.red(moment().format('YYYY-MM-DD HH:mm:ss'))}] ${colors.red(
        'Plugins setup error'
      )}`,
      colors.red(e)
    );
  }
}
