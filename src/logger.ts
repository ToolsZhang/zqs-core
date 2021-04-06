import * as counterFunc from 'passthrough-counter';
import * as humanize from 'humanize-number';
import * as bytes from 'bytes';
import * as chalk from 'chalk';
import * as util from 'util';
import * as mongoose from 'mongoose';
import { IContext } from './context';
import * as parsers from 'ua-parser-js';
import { Zqs } from './app';
import { IModel, Model, Schema } from './db';

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

export async function setup(app: Zqs) {
  LoginInforSchema = new Schema(
    {
      // 用户账号
      account: {
        type: String,
      },
      // 登录状态 （0成功 1失败）
      status: {
        type: Number,
        default: 1,
      },
      // 标题
      title: {
        type: String,
      },
      // 登录ip地址
      ipaddr: {
        type: String,
      },
      // 登录地点
      loginLocation: {
        type: String,
      },
      // 登录类别 (0其它 1后台用户 2移动端用户）
      loginDevice: {
        type: Number,
        required: true,
      },
      // 错误消息
      errorMsg: {
        type: String,
      },
      // 返回代码
      resultCode: {
        type: String,
      },
      // 浏览器类型
      browser: {
        type: String,
      },
      // 操作系统
      os: {
        type: String,
      },
      // 返回消息
      msg: {
        type: String,
      },
    },
    { timestamps: {} }
  );
  OperateLogSchema = new Schema(
    {
      // 操作模块
      title: {
        type: String,
        required: true,
      },
      // 业务类型
      // 0=查询,1=新增,2=修改,3=删除,4=授权,5=请求,6=导入,7=强退,8=登录,9=清空数据,10=其他
      businessType: {
        type: Number,
      },
      // 业务类型数组
      businessTypes: [
        {
          type: Number,
        },
      ],
      // 操作类别 (0其它 1后台用户 2手机端用户）
      operatorType: {
        type: Number,
        required: true,
      },
      // 操作人员
      operName: {
        type: String,
        required: true,
      },
      // 请求url
      operUrl: {
        type: String,
        required: true,
      },
      // 操作ip地址
      operIp: {
        type: String,
        required: true,
      },
      // 操作地点
      operLocation: {
        type: String,
      },
      // 请求参数
      operParam: {
        type: String,
      },
      // 返回参数
      jsonResult: {
        type: String,
      },
      // 返回代码
      resultCode: {
        type: String,
      },
      // 操作状态 （0正常 1异常）
      status: {
        type: Number,
        default: 1,
        required: true,
      },
      // 错误消息
      errorMsg: {
        type: String,
      },
      // 请求方式
      requestMethod: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        required: true,
      },
      // 请求方法(controller方法)
      method: {
        type: String,
      },
    },
    { timestamps: {} }
  );
  LoginInforModel = Model({
    name: '__logger_logininfor',
    auth: false,
    schema: LoginInforSchema,
  });

  OperateLogModel = Model({
    name: '__logger_operatelog',
    auth: false,
    schema: OperateLogSchema,
  });
}

/**
 * A mongoose schema with logininfor
 */
export let LoginInforSchema: mongoose.Schema;

/**
 * A mongoose schema with operatelog
 */
export let OperateLogSchema: mongoose.Schema;

/**
 * A mongoose model with name `__logger_logininfor`
 */
export let LoginInforModel: IModel;
/**
 * A mongoose model with name `__logger_operatelog`
 */
export let OperateLogModel: IModel;

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
    // execute filter
    const filter = executeFilters(ctx, options.logger);
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

    async function done(event: any) {
      res.removeListener('finish', onfinish);
      res.removeListener('close', onclose);

      // deal with filter
      if (filter) {
        if (ctx.status >= 200 && ctx.status < 400) filter.status = 0;
        else {
          if (ctx.body && ctx.body.message) filter.errorMsg = ctx.body.message;
          else filter.errorMsg = ctx.response.message;
        }
        filter.resultCode = ctx.status;
        filter.jsonResult = !!ctx.body ? JSON.stringify(ctx.body) : null;
        if ((<IConfigOperateLog>filter).operName) {
          (<IConfigOperateLog>filter).operName = !!ctx.request.auth
            ? ctx.request.auth.username
            : null;
          (<IConfigOperateLog>filter).operParam = !!ctx.request.fields
            ? JSON.stringify(ctx.request.fields)
            : null;
          await OperateLogModel.create(filter);
        } else {
          const accountName = (<IConfigLoginInfor>filter).account;
          if (ctx.request.fields[accountName])
            (<IConfigLoginInfor>filter).account =
              ctx.request.fields[accountName];
          await LoginInforModel.create(filter);
        }
      }
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

function executeFilters(ctx: IContext, logger: any) {
  if (!logger || !logger.allowPath) return;
  const allPath = ctx.originalUrl.split('/');
  if (mongoose.Types.ObjectId.isValid(allPath[allPath.length - 1])) {
    const allFilter = logger.allowPath.filter(item => {
      const ori_url = ctx.originalUrl.replace(
        '/' + allPath[allPath.length - 1],
        '/:id'
      );
      if (ori_url === item.url && item.method.indexOf(ctx.request.method) > -1)
        return item;
    });
    if (allFilter[0]) return formatFilters(allFilter[0], ctx);
  } else {
    const allFilter = logger.allowPath.filter(item => {
      if (item.logType === 'operate') {
        if (
          ctx.originalUrl === item.url &&
          item.operlogParams.method.indexOf(ctx.request.method) > -1
        )
          return item;
      } else if (item.logType === 'login') {
        if (ctx.originalUrl === item.url && ctx.request.method === 'POST')
          return item;
      }
    });
    if (allFilter[0]) {
      // 拦截日志
      return formatFilters(allFilter[0], ctx);
    }
  }
}

function formatFilters(allowPath: any, ctx: IContext) {
  if (allowPath.logType === 'operate') {
    const operaLog: IConfigOperateLog = <IConfigOperateLog>{};
    operaLog.operName = '未登录用户';
    operaLog.title = allowPath.operlogParams.title;
    operaLog.requestMethod = ctx.request.method;
    operaLog.operUrl = ctx.originalUrl;
    operaLog.status = 1;
    operaLog.operIp = getIp(ctx);
    if (operaLog.operIp === '::1') operaLog.operIp = '内网ip';
    operaLog.operatorType = getOperatorType(ctx);
    operaLog.businessTypes = allowPath.operlogParams.businessTypes;
    return operaLog;
  } else if (allowPath.logType === 'login') {
    const logininfor: IConfigLoginInfor = <IConfigLoginInfor>{};
    if (allowPath.loginforParams.params)
      logininfor.account = allowPath.loginforParams.params;
    logininfor.status = 1;
    logininfor.title = allowPath.loginforParams.title;
    logininfor.ipaddr = getIp(ctx);
    if (logininfor.ipaddr === '::1') logininfor.ipaddr = '内网ip';
    const ua = new parsers(ctx.request.header['user-agent']);
    if (logininfor.loginDevice === 1) logininfor.browser = ua.getBrowser().name;
    logininfor.os = ua.getOS().name;
    logininfor.loginDevice = getOperatorType(ctx);
    return logininfor;
  }
}

// 获取ip地址
function getIp(ctx: IContext) {
  const ip =
    ctx.req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
    ctx.req.connection.remoteAddress || // 判断 connection 的远程 IP
    ctx.req.socket.remoteAddress; // 判断后端的 socket 的 IP
  return ip && typeof ip === 'string'
    ? ip.replace(/::ffff:/, '')
    : ip[0].replace(/::ffff:/, '');
}

// 获取是否手机设备  1:浏览器 2:手机
function getOperatorType(ctx: IContext) {
  const userAgent = ctx.request.header['user-agent'].toLowerCase();
  const pat_phone = /ipad|iphone os|midp|rv:1.2.3.4|ucweb|android|windows ce|windows mobile/;
  return pat_phone.test(userAgent) ? 2 : 1;
}
export interface IConfig {
  allowPath: IConfigAllowPath[];
  /**
   * Default roles to contorl api
   */
  roles: string[];
  errors: {
    empty: string;
    emptyAuth: string;
    emptyUsername: string;
    emptyOperateLogID: string;
    emptyLoginInforID: string;
    operateLogNotFound: string;
    loginInforNotFound: string;
  };
}
export interface IConfigLoginPath {
  /**
   * 登录账号参数名 (eg: 'username')
   */
  params: string;
  /**
   * 登录标题 (eg: '手机号登录')
   */
  title: string;
}
export interface IConfigOperatePath {
  /**
   * 请求方式 ('GET','POST','PUT','PATCH','DELETE')
   */
  method: string[];

  /**
   * 日志标题
   */
  title: string;

  /**
   * 业务类型  0=查询,1=新增,2=修改,3=删除,4=授权,5=请求,6=导入,7=导出,8=强退,9=清空数据,10=其他
   */
  businessTypes: [IConfigOperatorType];
}
export interface IConfigAllowPath {
  /**
   * 日志初始化路径
   */
  url: string;

  /**
   * 日志类型 ('login' 'operate')
   */
  logType: IConfigLogType;

  /**
   * login类型 参数配置
   * 当日志类型 为login时必填
   */
  loginforParams?: IConfigLoginPath;

  /**
   * operate类型 参数配置
   * 当日志类型 为operate时必填
   */
  operlogParams?: IConfigOperatePath;
}

export enum IConfigLogType {
  /**
   *  登录
   */
  login = 'login',

  /**
   *  操作
   */
  operate = 'operate',
}

export enum IConfigOperatorType {
  /**
   *  查询
   */
  query = 0,
  /**
   * 新增
   */
  add = 1,
  /**
   * 修改
   */
  update = 2,
  /**
   * 删除
   */
  delete = 3,
  /**
   * 授权
   */
  authorize = 4,
  /**
   * 请求
   */
  request = 5,
  /**
   * 导入
   */
  import = 6,
  /**
   * 导出
   */
  export = 7,
  /**
   * 强退
   */
  exit = 8,
  /**
   * 清空数据
   */
  clear = 9,
  /**
   * 其他
   */
  other = 10,
}
export interface IConfigOperateLog {
  title: string;
  operName: string;
  operUrl: string;
  operIp: string;
  jsonResult: string;
  resultCode: number;
  requestMethod: string;
  operatorType: number;
  status: number;
  method?: string;
  errorMsg?: string;
  operParam?: string;
  businessType?: IConfigOperatorType;
  businessTypes?: [IConfigOperatorType];
  operLocation?: string;
}

export interface IConfigLoginInfor {
  account: string;
  title: string;
  status: number;
  ipaddr: string;
  os: string;
  resultCode: number;
  jsonResult: string;
  errorMsg?: string;
  loginDevice: number;
  browser?: string;
  loginLocation?: string;
}
