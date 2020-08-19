import climp from '../src';

describe('climp', () => {
  it('works', () => {
    const cli = climp();

    expect(cli()).toEqual('');
  });
});
