import { Zqs } from '../src/index';

(async () => {
  try {
    const config = {
      type: 'test',
      domain: '127.0.0.1',
      port: '9001',
      cors: {
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      },
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost/sample',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        },
        promise: global.Promise,
      },
      spdy: {
        options: {
          key: '',
          cert: '',
        },
        port: 433,
      },
      auth: {
        messages: {
          errors: {
            empty_username: 'Username cannot be blank',
            empty_password: 'Password cannot be blank',
            username_already_in_use:
              'The specified username is already in use.',
            username_not_registered: 'This username is not registered.',
            invalid_password: 'Invalid password',
            unauthorized: 'Unauthorized',
            invalid_token: 'Invalid token',
            no_permission: 'No permission to access',
          },
        },
        secret: 'This is a secret',
        enableBasicAuth: true,
        defaultRoles: ['user', 'admin', 'super'],
      },
      logger: {
        roles: ['user', 'admin', 'super'],
        allowPath: [
          {
            url: '/',
            logType: 'operate',
            operlogParams: {
              method: ['GET'],
              title: '默认首页',
              businessTypes: [1],
            },
          },
          {
            url: '/logger/operatelog',
            logType: 'operate',
            operlogParams: {
              method: ['GET'],
              title: '获取操作日志',
              businessTypes: [1],
            },
          },
          {
            url: '/auth/basic/signin',
            logType: 'login',
            loginforParams: {
              params: 'username',
              title: '账号密码登录',
            },
          },
        ],
        errors: {
          empty: 'Empty data or url',
          emptyAuth: 'Auth cannot be blank',
          emptyUsername: 'Username cannot be blank',
          emptyOperateLogID: 'OperateLogID cannot be blank',
          emptyLoginInforID: 'OperateLogID cannot be blank',
          operateLogNotFound: 'Operate Log NotFound',
          loginInforNotFound: 'Login Infor NotFound',
        },
      },
    };
    await Zqs.create(
      '/Users/mac/Products/server-framework/zqs-test',
      config
    ).start();
  } catch (e) {
    console.error(e);
  }
})();
