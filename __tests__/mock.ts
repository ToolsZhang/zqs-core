import { Mongoose } from '../src/db';
const Module = require('module');

const backupMongoose = {
  connect: Mongoose.connect,
  on: Mongoose.connection.on,
  exit: process.exit,
};

export function mockMongoose() {
  Mongoose.connect = jest.fn();
  Mongoose.connection.on = jest.fn().mockImplementation((x, cb) => cb(x));
  process.exit = jest.fn() as any;
}

export function unmockMongoose() {
  Mongoose.connect = backupMongoose.connect;
  Mongoose.connection.on = backupMongoose.on;
  process.exit = backupMongoose.exit;
}
