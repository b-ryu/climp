export default class ClimpError extends Error {
  constructor({message}) {
    super(message);
  }
}
