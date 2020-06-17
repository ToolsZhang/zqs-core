import * as koa from 'koa';
import * as body from 'koa-better-body';
import * as compress from 'koa-compress';
import * as cors from '@koa/cors';
import * as conditional from 'koa-conditional-get';
import * as convert from 'koa-convert';
import * as etag from 'koa-etag';
import * as logger from 'koa-logger';
import * as qs from 'qs';
import * as xml2json from 'xml2json';
import { setup as setupAuth } from './auth';
import { setup as setupHttp } from './http';
import { setup as setupSpdy } from './spdy';
import { setup as setupSocket } from './socket';
import { setup as setupMongodb } from './mongodb';
import { setup as setupPlugins } from './plugins';
import { setup as setupRouters } from './routers';

/**
 * The application class
 *
 * ```ts
 * const app = Zqs.create(dirname, config);
 * app.start();
 * ```
 */
export class Zqs extends koa {
  /**
   * Creating a Zqs application
   * @param dirname {string} App base dir
   * @param config  {object} App configurations
   */
  public static create(dirname: string, config: { [x: string]: any }) {
    Zqs.__instance = new Zqs(dirname, config);
    return Zqs.__instance;
  }

  private static __instance: Zqs;
  private __config: { [x: string]: any };
  private __dirname: string;

  private constructor(dirname: string, config: { [s: string]: any }) {
    super();
    this.__config = config;
    this.__dirname = dirname;
  }

  /**
   * The singleton instance.
   */
  public static get instance(): Zqs {
    return Zqs.__instance;
  }

  /**
   * The app configurations
   */
  public get config(): { [x: string]: any } {
    return this.__config;
  }

  /**
   * Thie app base dir
   */
  public get dir(): string {
    return this.__dirname;
  }
  /**
   * Starting webserver
   */
  public async start() {
    await setupMongodb(this);

    // Writing Middleware
    this.use(logger());

    // Setting cors
    if (this.config.cors) this.use(cors(this.config.cors));

    // Format body
    this.use(
      convert(
        body({
          jsonLimit: this.config.jsonLimit || '100kb',
          textLimit: this.config.textLimit || '100kb',
          formLimit: this.config.formLimit || '100kb',
          urlencodedLimit: this.config.urlencodedLimit || '100kb',
          bufferLimit: this.config.bufferLimit || '1mb',
          extendTypes: {
            custom: ['text/xml', 'application/xml'],
          },
          querystring: qs,
          *handler(ctx, opts) {
            const xml: string = yield ctx.request.text(opts.textLimit);
            const obj: any = xml2json.toJson(xml, { object: true });
            ctx.request.fields = obj.xml;
          },
        })
      )
    );

    // Compress Header
    this.use(compress());

    // Cache freshness Test
    this.use(conditional());

    // Cache
    this.use(etag());

    await setupAuth(this);
    await setupPlugins(this, 'pre');
    await setupRouters(this);
    await setupHttp(this);
    await setupSpdy(this);
    await setupSocket(this);
    await setupPlugins(this, 'post');
  }
}
