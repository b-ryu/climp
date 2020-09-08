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
  castArgValue,
  getCommandArgs,
  getArgs,
} from './util';
import {ErrorMessage} from './constants';

import type {ClimpConfig, SingularArg, FiniteArg, InfiniteArg} from './types';

export default function (config: ClimpConfig) {
  // TODO validate config

  return (argv: string[] = []) => {
    /*
      Get command
    */

    const [command, parseArgs] = getCommandArgs(argv, config);

    /*
      Get args
    */

    const [args, posArgs] = getArgs(command, config);

    /*
      Parse args
    */

    const argObj = {};

    let parseIndex = 0; // keep track of how many args we've parsed

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
              max = argv.length,
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

        const [posArgName, posArgValue] = posArgs.parse(parseArg);

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
