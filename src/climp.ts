/*
  TODO
  - improve pos arg support
  - validate config
  - support aliasing
  - reduce LOC
  - add more tests
*/

import ClimpError from './errors';
import {
  stripArgName,
  isArgName,
  argType,
  getCommandArgs,
  getArgs,
  parseArgs,
} from './util';
import {ErrorMessage} from './constants';

import type {ClimpConfig, SingularArg, FiniteArg, InfiniteArg} from './types';

export default function (config: ClimpConfig) {
  // TODO validate config

  return (argv: string[] = []) => {
    /*
      Get command
    */

    const [command, commandArgs] = getCommandArgs(argv, config);

    /*
      Get args
    */

    const [args, posArgs] = getArgs(command, config);

    /*
      Parse args
    */

    const argObj = {};

    let parseIndex = 0; // keep track of how many args we've parsed

    while (parseIndex < commandArgs.length) {
      const commmandArg = commandArgs[parseIndex];

      if (isArgName(commmandArg)) {
        const argName = commmandArg;
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

            const values = parseArgs(argName, parseIndex, commandArgs, types);

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
              max = argv.length,
            } = arg as InfiniteArg;

            const values = parseArgs(
              argName,
              parseIndex,
              commandArgs,
              Array(max).fill(type),
              false
            );

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

            const {type} = arg as SingularArg;

            const [value] = parseArgs(argName, parseIndex, commandArgs, [type]);

            argObj[strippedArgName] = value;

            ++parseIndex;

            break;
          }
        }
      } else {
        /*
          Positional arg
        */

        const [posArgName, posArgValue] = posArgs.parse(commmandArg);

        argObj[posArgName] = posArgValue;
      }

      ++parseIndex;
    }

    /*
      Check for missing required args
    */

    Object.keys(args).forEach((argName) => {
      if (args[argName].required && argObj[argName] == undefined) {
        throw new ClimpError({
          message: ErrorMessage.MISSING_REQUIRED_ARG(argName),
        });
      }
    });

    if (!posArgs.minimumMet()) {
      throw new ClimpError({
        message: ErrorMessage.NOT_ENOUGH_POS_ARGS(
          posArgs.minRequired,
          posArgs.readIn
        ),
      });
    }

    return command.func(argObj);
  };
}
