/*
  TODO
  - support aliasing
  - preprocess/validate config (i.e. validate arg names, argTypes, no duplicate names)
  - make arg types optional, use defaults (e.g. "cast" and SingularArg)
  - preprocess cliArgs (i.e. stripArgName, isArgName)
  - extract code to trim down this file's line count
  - extract out nameless command key into const
  - improve naming
  - make this prefix configurable
  - make string arg validation configurable (i.e. "strict" arg values)
  - emit warnings
  - InfinitePositionalArgs types: ignore/omit minimum on optional
*/

import ClimpError from './errors';
import {
  stripArgName,
  isArgName,
  argType,
  castArgValue,
  isType,
  normalizePositionalArgs,
  requiredNumOfArgs,
} from './util';
import {DEFAULT_COMMAND_NAME, ErrorMessage} from './constants';

import type {
  ClimpConfig,
  SingularArg,
  FiniteArg,
  InfiniteArg,
  Command,
  Arg,
  PositionalArg,
} from './types';

export default function (config: ClimpConfig) {
  return (argv: string[] = []) => {
    const totalArgCount = argv.length;

    /*
      Get command
    */

    const [command, parseArgs] = getCommandArgs(argv, config);

    /*
      Get args
    */

    const [args, posArgs] = getArgs(command, config, totalArgCount);

    /*
      Parse args
    */

    const argObj = {};

    let parseIndex = 0; // keep track of how many args we've parsed
    let posArgIndex = 0; // keep track of how many pos args we've parsed

    while (parseIndex < parseArgs.length) {
      const parseArg = parseArgs[parseIndex];

      if (isArgName(parseArg)) {
        const argName = parseArg;
        const strippedArgName = stripArgName(argName);

        const arg = args[strippedArgName];

        if (arg == undefined) {
          throw new ClimpError({
            message: ErrorMessage.UNRECOGNIZED_ARG(argName),
          });
        }

        switch (argType(arg)) {
          case 'boolean': {
            /*
              Boolean arg
            */

            argObj[strippedArgName] = true;

            break;
          }
          case 'finite': {
            /*
              Finite arg
            */

            const {types} = arg as FiniteArg;

            const values = [];

            while (values.length < types.length) {
              const valIndex = values.length;
              const valType = types[valIndex];
              const valParseIndex = parseIndex + valIndex + 1;

              if (valParseIndex >= parseArgs.length) {
                throw new ClimpError({
                  message: ErrorMessage.WRONG_NUMBER_OF_ARG_VALUES(
                    argName,
                    types.length,
                    valIndex
                  ),
                });
              }

              const value = parseArgs[valParseIndex];

              if (isArgName(value)) {
                throw new ClimpError({
                  message: ErrorMessage.ARG_NAME_VALUE(value, argName),
                });
              }

              const castedArgValue = castArgValue(value, valType);

              if (castedArgValue === null) {
                throw new ClimpError({
                  message: ErrorMessage.WRONG_ARG_TYPE(argName, valType, value),
                });
              }

              values.push(castedArgValue);
            }

            argObj[strippedArgName] = values;

            parseIndex += values.length;

            break;
          }
          case 'infinite': {
            /*
              Infinite arg
            */

            const {
              types: type,
              min = 0,
              max = totalArgCount,
            } = arg as InfiniteArg;

            const values = [];

            while (values.length < max) {
              const valIndex = values.length;
              const valType = type;
              const valParseIndex = parseIndex + valIndex + 1;

              if (valParseIndex >= parseArgs.length) {
                break;
              }

              const value = parseArgs[valParseIndex];

              if (isArgName(value)) {
                break;
              }

              const castedArgValue = castArgValue(value, valType);

              if (castedArgValue === null) {
                break;
              }

              values.push(castedArgValue);
            }

            if (values.length < min) {
              throw new ClimpError({
                message: ErrorMessage.NOT_ENOUGH_ARG_VALUES(
                  argName,
                  min,
                  values.length
                ),
              });
            }

            argObj[strippedArgName] = values;

            parseIndex += values.length;

            break;
          }
          case 'singular': {
            /*
              Singular arg
            */

            const valParseIndex = parseIndex + 1;

            if (valParseIndex >= parseArgs.length) {
              throw new ClimpError({
                message: ErrorMessage.NO_ARG_VALUE_PROVIDED(argName),
              });
            }

            const value = parseArgs[valParseIndex];

            if (isArgName(value)) {
              throw new ClimpError({
                message: ErrorMessage.ARG_NAME_VALUE(value, argName),
              });
            }

            const {type} = arg as SingularArg;
            const castedArgValue = castArgValue(value, type);

            if (castedArgValue === null) {
              throw new ClimpError({
                message: ErrorMessage.WRONG_ARG_TYPE(argName, type, value),
              });
            }

            argObj[strippedArgName] = castedArgValue;

            ++parseIndex;

            break;
          }
        }
      } else {
        /*
          Positional arg
        */

        const value = parseArg;

        if (posArgIndex >= posArgs.length) {
          throw new ClimpError({
            message: ErrorMessage.TOO_MANY_POS_ARGS(value, posArgs.length),
          });
        }

        const posArg = posArgs[posArgIndex];
        const {name: posArgName = posArgIndex, type} = isType(posArg)
          ? {type: posArg}
          : posArg;

        const castedArgValue = castArgValue(value, type);

        if (castedArgValue === null) {
          // TODO improve parsing: what if pos args are optional
          throw new ClimpError({
            message: ErrorMessage.WRONG_POS_ARG_TYPE(
              parseIndex,
              posArgIndex,
              type,
              value
            ),
          });
        }

        argObj[posArgName] = castedArgValue;

        ++posArgIndex;
      }

      ++parseIndex;
    }

    /*
      Check for missing required args
    */

    Object.keys(args).forEach((argName) => {
      if (
        argType(args[argName]) !== 'boolean' &&
        args[argName].required &&
        argObj[argName] == undefined
      ) {
        throw new ClimpError({
          message: ErrorMessage.MISSING_REQUIRED_ARG(argName),
        });
      }
    });

    const totalRequiredPosArgs =
      requiredNumOfArgs(config?.global?.positionalArgs?.required) +
      requiredNumOfArgs(command.positionalArgs?.required);

    if (posArgIndex < totalRequiredPosArgs) {
      throw new ClimpError({
        message: ErrorMessage.NOT_ENOUGH_POS_ARGS(
          totalRequiredPosArgs,
          posArgIndex
        ),
      });
    }

    return command.func(argObj);
  };
}

/*
  Derive a command and its options from a list of args and a config
*/
function getCommandArgs(
  args: string[],
  config: ClimpConfig
): [Command, string[]] {
  const {commands} = config;
  const [firstArg, ...restArgs] = args;

  if (firstArg === undefined) {
    if (commands[DEFAULT_COMMAND_NAME]) {
      return [commands[DEFAULT_COMMAND_NAME], []];
    } else {
      throw new ClimpError({
        message: ErrorMessage.NO_ARGS(),
      });
    }
  } else if (commands[firstArg]) {
    return [commands[firstArg], restArgs];
  } else if (commands[DEFAULT_COMMAND_NAME]) {
    return [commands[DEFAULT_COMMAND_NAME], args];
  } else {
    throw new ClimpError({
      message: ErrorMessage.UNRECOGNIZED_COMMAND(firstArg),
    });
  }
}

/*
  Derive consolidated args/positional args for a given command
*/
function getArgs(
  command: Command,
  config: ClimpConfig,
  maxArgCount: number
): [Record<string, Arg>, PositionalArg[]] {
  const {
    args: cArgs = {},
    positionalArgs: {
      optional: cOptPosArgs = [],
      required: cReqPosArgs = [],
    } = {},
  } = command;
  const {
    global: {
      args: gArgs = {},
      positionalArgs: {
        optional: gOptPosArgs = [],
        required: gReqPosArgs = [],
      } = {},
    } = {},
  } = config;

  return [
    {
      ...cArgs,
      ...gArgs,
    },
    [
      // TODO improve this
      ...normalizePositionalArgs(gReqPosArgs, maxArgCount),
      ...normalizePositionalArgs(cReqPosArgs, maxArgCount),
      ...normalizePositionalArgs(gOptPosArgs, maxArgCount),
      ...normalizePositionalArgs(cOptPosArgs, maxArgCount),
    ],
  ];
}
