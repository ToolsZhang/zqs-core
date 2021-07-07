import * as colors from 'colors/safe';
import * as moment from 'moment';
import { IContext } from './context';
import * as boom from '@hapi/boom';

/**
 * 422 bad data errors
 */
const BadDataErrors = ['CastError', 'ValidationError', 'SyntaxError'];

export function handleError(
  ctx: IContext,
  error: any,
  statusCode: number = 500
): void {
  let be: boom.Boom;
  let attributes;
  if (error.isBoom) {
    be = error;
  } else if (BadDataErrors.includes(error.name)) {
    be = boom.boomify(error, {
      statusCode: 422,
    });

    const errors = (<any>error).errors;
    if (errors) attributes = errors;
  } else {
    be = boom.badImplementation(error, 500);
  }
  if (be.output.statusCode >= 500) {
    console.log(`[${colors.red(moment().format('YY-MM-DD HH:mm:ss'))}]`);
    console.log(colors.red(JSON.stringify(be.output.payload, null, 2)));
    console.error(error);
    if (attributes) console.error(attributes);
  } else {
    console.log(`[${colors.yellow(moment().format('YY-MM-DD HH:mm:ss'))}]`);
    console.log(colors.yellow(JSON.stringify(be.output.payload, null, 2)));
    if (attributes) console.error(attributes);
  }
  ctx.status = be.output.statusCode;
  ctx.body = be.output.payload;
}

/**
 * ref to boom
 */
export const Boom = boom;
