'use strict';
const binding = require('bindings')('serialport.node');
const BaseBinding = require('./base');
const promisify = require('../util').promisify;
const unixRead = require('./unix-read');

const defaultBindingOptions = Object.freeze({
  vmin: 1,
  vtime: 0
});

class DarwinBinding extends BaseBinding {
  static list() {
    return promisify(binding.list)();
  }

  constructor(opt) {
    super(opt);
    this.disconnect = opt.disconnect;
    this.bindingOptions = opt.bindingOptions || {};
    this.fd = null;
  }

  get isOpen() {
    return this.fd !== null;
  }

  open(path, options) {
    return super.open(path, options)
      .then(() => {
        options = Object.assign({}, defaultBindingOptions, this.bindingOptions, options);
        return promisify(binding.open)(path, options);
      })
      .then((fd) => { this.fd = fd });
  }

  close() {
    return super.close()
      .then(() => {
        if (this.readPoller) {
          this.readPoller.close();
          this.readPoller = null;
        }

        return promisify(binding.close)(this.fd);
      })
      .then(() => { this.fd = null });
  }

  read(buffer, offset, length) {
    return super.read(buffer, offset, length)
      .then(() => unixRead.call(this, buffer, offset, length));
  }

  write(buffer) {
    return super.write(buffer)
      .then(() => promisify(binding.write)(this.fd, buffer));
  }

  update(options) {
    return super.update(options)
      .then(() => promisify(binding.update)(this.fd, options));
  }

  set(options) {
    return super.set(options)
      .then(() => promisify(binding.set)(this.fd, options));
  }

  get() {
    return super.get()
      .then(() => promisify(binding.get)(this.fd));
  }

  drain() {
    return super.drain()
      .then(() => promisify(binding.drain)(this.fd));
  }

  flush() {
    return super.flush()
      .then(() => promisify(binding.flush)(this.fd));
  }
}

module.exports = DarwinBinding;
