import * as counterFunc from 'passthrough-counter';
import * as humanize from 'humanize-number';
import * as bytes from 'bytes';
import * as chalk from 'chalk';
import * as util from 'util';
import { IContext } from './context';

// color map.
const colorCodes = {
  7: 'magenta',
  5: 'red',
  4: 'yellow',
  3: 'cyan',
  2: 'green',
  1: 'green',
  0: 'yellow',
};

export async function logger(options: any) {
  // print to console helper.
  const print = (() => {
    let transporter;
    if (typeof options === 'function') {
      transporter = options;
    } else if (options && options.transporter) {
      transporter = options.transporter;
    }

    // eslint-disable-next-line func-names
    return function printFunc(...args: any) {
      const string = util.format('%s', args);
      if (transporter) transporter(string, args);
      else console.log(string);
    };
  })();
  // eslint-disable-next-line func-names
  return async function loggerRe(ctx: IContext, next: any) {
    // request
    const start = ctx[Symbol.for('request-received.startTime')]
      ? ctx[Symbol.for('request-received.startTime')].getTime()
      : Date.now();
    print(
      '  ' +
        chalk.gray('<==') +
        ' ' +
        chalk.bold(ctx.method) +
        ' ' +
        chalk.gray(ctx.originalUrl)
    );
    try {
      await next();
    } catch (err) {
      // log uncaught downstream errors
      log(print, ctx, start, null, err, null);
      throw err;
    }

    // calculate the length of a streaming response
    // by intercepting the stream with a counter.
    // only necessary if a content-length header is currently not set.
    const {
      body,
      response: { length },
    } = ctx;
    let counter;
    if (length === null && body && body.readable)
      ctx.body = body.pipe((counter = counterFunc())).on('error', ctx.onerror);

    // log when the response is finished or closed,
    // whichever happens first.
    const { res } = ctx;

    const onfinish = done.bind(null, 'finish');
    const onclose = done.bind(null, 'close');

    res.once('finish', onfinish);
    res.once('close', onclose);

    function done(event: any) {
      res.removeListener('finish', onfinish);
      res.removeListener('close', onclose);
      log(print, ctx, start, counter ? counter.length : length, null, event);
    }
  };
}
// Log helper.
function log(
  print: any,
  ctx: IContext,
  start: any,
  length_: number,
  err: any,
  event: any
) {
  // get the status code of the response
  const status = err
    ? err.isBoom
      ? err.output.statusCode
      : err.status || 500
    : ctx.status || 404;

  // set the color of the status code;
  const s = (status / 100) | 0;
  const color = colorCodes.hasOwnProperty(s) ? colorCodes[s] : colorCodes[0];

  // get the human readable response length
  const length = [204, 205, 304].includes(status)
    ? ''
    : length_ == null
    ? '-'
    : bytes(length_).toLowerCase();
  const upstream = err
    ? chalk.red('xxx')
    : event === 'close'
    ? chalk.yellow('-x-')
    : chalk.gray('==>');

  print(
    '  ' +
      upstream +
      ' ' +
      chalk.bold(ctx.method) +
      ' ' +
      chalk.gray(ctx.originalUrl) +
      ' ' +
      chalk[color](status) +
      ' ' +
      chalk.gray(time(start)) +
      ' ' +
      chalk.gray(length)
  );
  /**
   * Show the response time in a human readable format.
   * In milliseconds if less than 10 seconds,
   * in seconds otherwise.
   */
  function time(start: number) {
    const delta = Date.now() - start;
    return humanize(
      delta < 10000 ? delta + 'ms' : Math.round(delta / 1000) + 's'
    );
  }
}
