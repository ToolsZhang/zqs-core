import { Js2Xml } from 'js2xml';
import { IContext } from './context';

export function response(ctx: IContext, status: number, body?: any) {
  if (!body) ctx.type = 'text/plain';
  if ('application/xml' === ctx.headers.accept) {
    const json = JSON.stringify(body);
    const obj = JSON.parse(json);
    const xml: any = new Js2Xml('xml', obj);
    ctx.status = status;
    ctx.type = `${ctx.headers.accept}; charset=utf-8`;
    ctx.body = xml.toString();
  } else {
    ctx.status = status;
    ctx.body = body;
  }
}
