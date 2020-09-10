/*
  lmao wtf: https://github.com/microsoft/TypeScript/issues/13965
*/
export default class ClimpError extends Error {
  __proto__: Error;

  constructor({message}) {
    const proto = new.target.prototype;
    super(message);

    this.name = 'ClimpError';
    this.__proto__ = proto;
  }
}
