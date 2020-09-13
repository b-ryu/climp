import ClimpError from './errors';
import {
  stripArgName,
  isArgName,
  argType,
  getCommandArgs,
  getArgs,
  parseArgValues,
} from './util';
import {ErrorMessage} from './constants';

import type {
  ClimpConfig,
  SingularArg,
  FiniteArg,
  InfiniteArg,
  ArgObj,
} from './types';

export default function (config: ClimpConfig) {
  return (argv: string[] = []) => {
    const [command, commandArgs] = getCommandArgs(argv, config);
    const [args, posArgs] = getArgs(command, config);

    const argObj: ArgObj = {};

    let parseIndex = 0;

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
            argObj[strippedArgName] = true;

            break;
          }
          case 'finite': {
            const {types} = arg as FiniteArg;

            const values = parseArgValues(
              argName,
              parseIndex,
              commandArgs,
              types
            );

            argObj[strippedArgName] = values;

            parseIndex += values.length;

            break;
          }
          case 'infinite': {
            const {
              types: type,
              min = 0,
              max = argv.length,
            } = arg as InfiniteArg;

            const values = parseArgValues(
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
            const {type} = arg as SingularArg;

            const [value] = parseArgValues(argName, parseIndex, commandArgs, [
              type,
            ]);

            argObj[strippedArgName] = value;

            ++parseIndex;

            break;
          }
        }
      } else {
        const [posArgName, posArgValue] = posArgs.parse(commmandArg);

        argObj[posArgName] = posArgValue;
      }

      ++parseIndex;
    }

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
