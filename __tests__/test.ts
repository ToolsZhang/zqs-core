import { Zqs } from '../src/index';

(async () => {
  try {
    const config = {
      domain: '127.0.0.1',
      port: '9001',
      cors: { ok: 'ok' },
    };
    await Zqs.create('here', config).start();
  } catch (e) {
    console.error(e);
  }
})();
