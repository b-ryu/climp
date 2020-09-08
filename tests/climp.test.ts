import climp from '../src';
import {ErrorMessage} from '../src/constants';

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

      expect(cli([])).toStrictEqual({});
    });

    it('calls the default command if the first arg is not a command name', () => {
      const cli = climp({
        commands: {
          _: {
            func: testFunc,
            args: {
              arg1: {type: 'boolean'},
            },
          },
        },
      });

      expect(cli(['--arg1'])).toStrictEqual({arg1: true});
    });

    it('accepts commands without any args', () => {
      const cli = climp({
        commands: {
          cmd: {
            func: testFunc,
          },
        },
      });

      expect(cli(['cmd'])).toStrictEqual({});
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

      expect(
        cli(['cmd', '--arg1', '--arg3', '34', '--arg2', 'test'])
      ).toStrictEqual({
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
              required: {types: 'string', min: 1, max: 1},
            },
          },
        },
      });

      expect(cli(['cmd', 'true', 'true'])).toStrictEqual({
        0: 'true',
        1: true,
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

      expect(cli(['cmd', 'true', '2', '2test'])).toStrictEqual({
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
      ).toStrictEqual({
        0: false,
        arg2: 'test2',
        arg4: [false, 'test1'],
        arg5: '123',
        2: 123,
      });
    });

    it('parses a mix of command and global args', () => {
      const cli = climp({
        commands: {
          cmd: {
            func: testFunc,
            positionalArgs: {
              optional: ['number', 'string'],
            },
          },
        },
        global: {
          positionalArgs: {
            optional: ['boolean', {name: 'arg5', type: 'string'}],
          },
        },
      });

      expect(cli(['cmd', 'false', '2', '1', 'test2'])).toStrictEqual({
        0: false,
        arg5: '2',
        2: 1,
        3: 'test2',
      });
    });

    it('handles unspecified number of args', () => {
      const cli = climp({
        commands: {
          cmd: {
            func: testFunc,
            positionalArgs: {
              optional: {
                types: 'string',
              },
            },
          },
        },
      });

      expect(cli(['cmd'])).toStrictEqual({});
      expect(cli(['cmd', 'arg1', 'arg2', 'arg3'])).toStrictEqual({
        0: 'arg1',
        1: 'arg2',
        2: 'arg3',
      });
    });

    it('stops parsing infinite args chains when args do not meet conditions', () => {
      const cli = climp({
        commands: {
          cmd: {
            func: testFunc,
            args: {
              cArg: {types: 'boolean'},
            },
          },
        },
        global: {
          positionalArgs: {
            required: {types: 'cast'},
          },
        },
      });

      expect(cli(['cmd', '--cArg', 'true', '3', 'false'])).toStrictEqual({
        cArg: [true],
        0: 3,
        1: false,
      });
    });

    it('parses global args first', () => {
      const cli = climp({
        commands: {
          cmd: {
            func: testFunc,
            positionalArgs: {
              optional: {
                types: 'string',
              },
            },
          },
        },
        global: {
          positionalArgs: {
            optional: [
              {name: 'gArg1', type: 'string'},
              {name: 'gArg2', type: 'string'},
            ],
          },
        },
      });

      expect(cli(['cmd', 'arg1', 'arg2', 'arg3', 'arg4'])).toStrictEqual({
        gArg1: 'arg1',
        gArg2: 'arg2',
        2: 'arg3',
        3: 'arg4',
      });
    });

    it('parses required args first', () => {
      const cli = climp({
        commands: {
          cmd: {
            func: testFunc,
            positionalArgs: {
              required: ['string'],
            },
          },
        },
        global: {
          positionalArgs: {
            optional: [
              {name: 'gArg1', type: 'string'},
              {name: 'gArg2', type: 'string'},
            ],
          },
        },
      });

      expect(cli(['cmd', 'arg1', 'arg2', 'arg3'])).toStrictEqual({
        0: 'arg1',
        gArg1: 'arg2',
        gArg2: 'arg3',
      });
    });
  });

  describe('errors/invariants', () => {
    it('throws an error if no default command is defined and no args are passed', () => {
      const cli = climp({
        commands: {},
      });

      expect(() => cli([])).toThrow(ErrorMessage.NO_ARGS());
    });

    it('throws an error if command is not defined', () => {
      const cli = climp({
        commands: {
          cmd1: {func: testFunc},
        },
      });

      expect(() => cli(['cmd2'])).toThrow(
        ErrorMessage.UNRECOGNIZED_COMMAND('cmd2')
      );
    });

    it('throws an error if an arg is not recognized', () => {
      const cli = climp({
        commands: {
          cmd1: {func: testFunc},
        },
      });

      expect(() => cli(['cmd1', '--test'])).toThrow(
        ErrorMessage.UNRECOGNIZED_ARG('--test')
      );
    });

    it('throws an error if too many positional args are passed', () => {
      const cli = climp({
        commands: {
          cmd1: {func: testFunc},
        },
      });

      expect(() => cli(['cmd1', 'test'])).toThrow(
        ErrorMessage.TOO_MANY_POS_ARGS('test', 0)
      );
    });

    describe('singular args', () => {
      it('throws an error if a value is not provided', () => {
        const cli = climp({
          commands: {
            cmd1: {
              func: testFunc,
              args: {
                fArg: {type: 'string'},
              },
            },
          },
        });

        expect(() => cli(['cmd1', '--fArg'])).toThrow(
          ErrorMessage.NO_ARG_VALUE_PROVIDED('--fArg')
        );
      });
    });

    describe('finite args', () => {
      it('throws an error if too few finite arg values are passed', () => {
        const cli = climp({
          commands: {
            cmd1: {
              func: testFunc,
              args: {
                fArg: {types: ['boolean', 'string', 'number']},
              },
            },
          },
        });

        expect(() => cli(['cmd1', '--fArg', 'false'])).toThrow(
          ErrorMessage.WRONG_NUMBER_OF_ARG_VALUES('--fArg', 3, 1)
        );
      });

      it('throws an error if too many finite arg values are passed', () => {
        const cli = climp({
          commands: {
            cmd1: {
              func: testFunc,
              args: {
                fArg: {types: ['boolean', 'string', 'number']},
              },
            },
          },
        });

        expect(() =>
          cli(['cmd1', '--fArg', 'false', 'test', '23', 'test'])
        ).toThrow(ErrorMessage.TOO_MANY_POS_ARGS('test', 0));
      });

      it('throws an error if the wrong type of arg value is passed', () => {
        const cli = climp({
          commands: {
            cmd1: {
              func: testFunc,
              args: {
                fArg: {types: ['boolean', 'string', 'number']},
              },
            },
          },
        });

        expect(() =>
          cli(['cmd1', '--fArg', 'notBoolean', 'test', '23'])
        ).toThrow(
          ErrorMessage.WRONG_ARG_TYPE('--fArg', 'boolean', 'notBoolean')
        );
      });

      it('throws an error if an arg name is passed as a value', () => {
        const cli = climp({
          commands: {
            cmd1: {
              func: testFunc,
              args: {
                fArg: {types: ['boolean', 'string', 'number']},
              },
            },
          },
        });

        expect(() => cli(['cmd1', '--fArg', 'true', '--test', '23'])).toThrow(
          ErrorMessage.ARG_NAME_VALUE('--test', '--fArg')
        );
      });
    });

    describe('infinite args', () => {
      it('throws an error if the number of passed values is below the minimum', () => {
        const cli = climp({
          commands: {
            cmd1: {
              func: testFunc,
              args: {
                arg1: {types: 'string', min: 7},
              },
            },
          },
        });

        expect(() =>
          cli(['cmd1', '--arg1', 'test', 'test', 'test', 'test', 'test'])
        ).toThrow(ErrorMessage.NOT_ENOUGH_ARG_VALUES('--arg1', 7, 5));
      });
    });

    describe('positional args', () => {
      it('throws an error if the number of passed values exceeds the maximum', () => {
        const cli = climp({
          commands: {
            cmd1: {
              func: testFunc,
              positionalArgs: {
                optional: {types: 'string', max: 4},
              },
            },
          },
        });

        expect(() =>
          cli(['cmd1', 'test', 'test', 'test', 'test', 'test'])
        ).toThrow(ErrorMessage.TOO_MANY_POS_ARGS('test', 4));
      });

      it('throws an error if the number of passed values is below the minium', () => {
        const cli = climp({
          commands: {
            cmd1: {
              func: testFunc,
              positionalArgs: {
                required: {types: 'string', min: 4},
              },
            },
          },
        });

        expect(() => cli(['cmd1', 'test', 'test', 'test'])).toThrow(
          ErrorMessage.NOT_ENOUGH_POS_ARGS(4, 3)
        );
      });

      it('throws an error if the values passed in are of the wrong type', () => {
        const cli = climp({
          commands: {
            cmd1: {
              func: testFunc,
              positionalArgs: {
                required: {types: 'boolean'},
              },
            },
          },
        });

        expect(() => cli(['cmd1', 'true', 'test', 'false'])).toThrow(
          ErrorMessage.WRONG_POS_ARG_TYPE(1, 1, 'boolean', 'test')
        );
      });
    });

    it('throws an error if a required arg is not passed in', () => {
      const cli = climp({
        commands: {
          cmd1: {
            func: testFunc,
            args: {
              arg1: {type: 'string', required: true},
            },
          },
        },
      });

      expect(() => cli(['cmd1'])).toThrow(
        ErrorMessage.MISSING_REQUIRED_ARG('arg1')
      );
    });
  });
});
