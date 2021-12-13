import ClimpError from './errors';
import {
  stripArgName,
  isArgName,
  argType,
  splitCommandAndArgs,
  getCommandArgConfig,
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
    const [command, commandArgs] = splitCommandAndArgs(argv, config);
    const [argsConfig, posArgsParser] = getCommandArgConfig(command, config);

    // Parse args
    const argBody: ArgObj = {}; // the arg body is what gets passed to the final function

    let parseIndex = 0;
    while (parseIndex < commandArgs.length) {
      const commmandArg = commandArgs[parseIndex];

      // Parse positional args
      if (!isArgName(commmandArg)) {
        const [posArgName, posArgValue] = posArgsParser.parse(commmandArg);
        argBody[posArgName] = posArgValue;
        ++parseIndex;
        continue;
      }

      // Parse named args
      const argName = commmandArg;
      const strippedArgName = stripArgName(argName);
      const arg = argsConfig[strippedArgName];

      if (arg == undefined) {
        throw new ClimpError({
          message: ErrorMessage.UNRECOGNIZED_ARG(argName),
        });
      }

      // Parse based on arg type
      switch (argType(arg)) {
        case 'boolean': {
          // Boolean flags simply get set to true if present
          argBody[strippedArgName] = true;
          ++parseIndex;
          continue;
        }
        case 'finite': {
          // Finite args count the exact number of following args as values
          const {types} = arg as FiniteArg;
          const values = parseArgValues(
            argName,
            parseIndex,
            commandArgs,
            types
          );
          argBody[strippedArgName] = values;
          parseIndex += 1 + values.length;
          continue;
        }
        case 'infinite': {
          // Infinite/indefinite args parse as many as it can up to the maximum
          const {types: type, min = 0, max = argv.length} = arg as InfiniteArg;
          const values = parseArgValues(
            argName,
            parseIndex,
            commandArgs,
            Array(max).fill(type),
            false
          );
          // If the minimum was not met, throw an error
          if (values.length < min) {
            throw new ClimpError({
              message: ErrorMessage.NOT_ENOUGH_ARG_VALUES(
                argName,
                min,
                values.length
              ),
            });
          }
          argBody[strippedArgName] = values;
          parseIndex += 1 + values.length;
          continue;
        }
        case 'singular': {
          // Singular args are really just a subset of finite args
          const {type} = arg as SingularArg;
          const [value] = parseArgValues(argName, parseIndex, commandArgs, [
            type,
          ]);
          argBody[strippedArgName] = value;
          parseIndex += 2;
          continue;
        }
      }
    }

    // Verify that all required named arguments were passed in
    Object.entries(argsConfig).forEach(([argName, arg]) => {
      if (arg.required && argBody[argName] == undefined) {
        throw new ClimpError({
          message: ErrorMessage.MISSING_REQUIRED_ARG(argName),
        });
      }
    });

    // Verify that a sufficient number of positional arguments were passed in
    if (!posArgsParser.minimumMet()) {
      throw new ClimpError({
        message: ErrorMessage.NOT_ENOUGH_POS_ARGS(
          posArgsParser.minRequired,
          posArgsParser.readIn
        ),
      });
    }

    return command.func(argBody);
  };
}
