import climp from '../src';

function testFunc(config) {
  return config;
}

describe('climp', () => {
  describe('arguments', () => {
    it('accepts no args when a default command has been defined', () => {
      const cli = climp({
        commands: {
          _: {
            func: testFunc,
          },
        },
      });

      expect(cli([])).toEqual({});
    });

    it('accepts commands without any args', () => {
      const cli = climp({
        commands: {
          cmd: {
            func: testFunc,
          },
        },
      });

      expect(cli(['cmd'])).toEqual({});
    });

    it('parses named args', () => {
      const cli = climp({
        commands: {
          cmd: {
            func: testFunc,
            args: {
              arg1: {type: 'boolean'},
              arg2: {type: 'string'},
              arg3: {type: 'number'},
            },
          },
        },
      });

      expect(cli(['cmd', '--arg1', '--arg3', '34', '--arg2', 'test'])).toEqual({
        arg1: true,
        arg2: 'test',
        arg3: 34,
      });
    });

    it('parses positional args', () => {
      const cli = climp({
        commands: {
          cmd: {
            func: testFunc,
            positionalArgs: {
              optional: ['boolean', {name: 'arg1', type: 'string'}],
            },
          },
        },
      });

      expect(cli(['cmd', 'true', 'test'])).toEqual({
        0: true,
        arg1: 'test',
      });
    });

    it('correctly casts "cast" arg types', () => {
      const cli = climp({
        commands: {
          cmd: {
            func: testFunc,
            positionalArgs: {
              optional: ['cast', {name: 'arg1', type: 'cast'}, 'cast'],
            },
          },
        },
      });

      expect(cli(['cmd', 'true', '2', '2test'])).toEqual({
        0: true,
        arg1: 2,
        2: '2test',
      });
    });

    it('parses a mix of named and positional args', () => {
      const cli = climp({
        commands: {
          cmd: {
            func: testFunc,
            args: {
              arg1: {type: 'boolean'},
              arg2: {type: 'string'},
              arg3: {type: 'number'},
              arg4: {types: ['boolean', 'string']},
            },
            positionalArgs: {
              optional: ['boolean', {name: 'arg5', type: 'string'}, 'number'],
            },
          },
        },
      });

      expect(
        cli([
          'cmd',
          '--arg4',
          'false',
          'test1',
          'false',
          '--arg2',
          'test2',
          '123',
          '123',
        ])
      ).toEqual({
        0: false,
        arg2: 'test2',
        arg4: [false, 'test1'],
        arg5: '123',
        2: 123,
      });
    });

    // it('parses a mix of command and global args');

    // it('handles unspecified number of args');

    // it('accepts the omission of optional args');
  });

  describe('errors/invariants', () => {});
});
