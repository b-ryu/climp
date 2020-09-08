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
} from './types';

export default function (config: ClimpConfig) {
  return (cliArgs: string[] = []) => {
    /*
      Get command
    */

    const [firstArg] = cliArgs;
    let command: Command;
    let commandArgs: string[];

    if (firstArg === undefined) {
      if (config.commands[DEFAULT_COMMAND_NAME]) {
        command = config.commands[DEFAULT_COMMAND_NAME];
        commandArgs = [];
      } else {
        throw new ClimpError({
          message: ErrorMessage.NO_ARGS(),
        });
      }
    } else if (config.commands[firstArg]) {
      command = config.commands[firstArg];
      [, ...commandArgs] = cliArgs;
    } else if (config.commands[DEFAULT_COMMAND_NAME]) {
      command = config.commands[DEFAULT_COMMAND_NAME];
      commandArgs = cliArgs;
    } else {
      throw new ClimpError({
        message: ErrorMessage.UNRECOGNIZED_COMMAND(firstArg),
      });
    }

    /*
      Get arg descriptors
    */

    const args = {
      ...(command.args || {}),
      ...(config?.global?.args || {}),
    };

    const posArgs = [
      ...normalizePositionalArgs(
        config?.global?.positionalArgs?.required,
        cliArgs.length
      ),
      ...normalizePositionalArgs(
        command.positionalArgs?.required,
        cliArgs.length
      ),
      ...normalizePositionalArgs(
        config?.global?.positionalArgs?.optional,
        cliArgs.length
      ),
      ...normalizePositionalArgs(
        command.positionalArgs?.optional,
        cliArgs.length
      ),
    ];

    /*
      Parse args
    */

    const argObj = {};

    let posArgIndex = 0;
    let index = 0;

    while (index < commandArgs.length) {
      if (isArgName(commandArgs[index])) {
        const argName = commandArgs[index];
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

            const argTypes = (arg as FiniteArg).types;
            const argValues = Array(argTypes.length);

            argTypes.forEach((type, argIndex) => {
              if (index + argIndex >= commandArgs.length - 1) {
                throw new ClimpError({
                  message: ErrorMessage.WRONG_NUMBER_OF_ARG_VALUES(
                    argName,
                    argTypes.length,
                    argIndex
                  ),
                });
              }

              const argValue = commandArgs[index + argIndex + 1];

              if (isArgName(argValue)) {
                throw new ClimpError({
                  message: ErrorMessage.ARG_NAME_VALUE(argValue, argName),
                });
              }

              const castedArgValue = castArgValue(argValue, type);

              if (castedArgValue === null) {
                throw new ClimpError({
                  message: ErrorMessage.WRONG_ARG_TYPE(argName, type, argValue),
                });
              }

              argValues[argIndex] = castedArgValue;
            });

            argObj[strippedArgName] = argValues;

            index += argTypes.length;

            break;
          }
          case 'infinite': {
            /*
              Infinite arg
            */

            const {
              types: argType,
              min = 0,
              max = cliArgs.length,
            } = arg as InfiniteArg;

            const argValues = [];

            while (argValues.length < max) {
              const argIndex = argValues.length;

              if (index + argIndex >= commandArgs.length - 1) {
                break;
              }

              const argValue = commandArgs[index + argIndex + 1];

              if (isArgName(argValue)) {
                break;
              }

              const castedArgValue = castArgValue(argValue, argType);

              if (castedArgValue === null) {
                throw new ClimpError({
                  message: ErrorMessage.WRONG_ARG_TYPE(
                    argName,
                    argType,
                    argValue
                  ),
                });
              }

              argValues.push(castedArgValue);
            }

            if (argValues.length < min) {
              throw new ClimpError({
                message: ErrorMessage.NOT_ENOUGH_ARG_VALUES(
                  argName,
                  min,
                  argValues.length
                ),
              });
            }

            argObj[strippedArgName] = argValues;

            index += argValues.length;

            break;
          }
          case 'singular': {
            /*
              Singular arg
            */

            if (index >= commandArgs.length - 1) {
              throw new ClimpError({
                message: ErrorMessage.NO_ARG_VALUE_PROVIDED(argName),
              });
            }

            const argValue = commandArgs[index + 1];

            if (isArgName(argValue)) {
              throw new ClimpError({
                message: ErrorMessage.ARG_NAME_VALUE(argValue, argName),
              });
            }

            const argValueType = (arg as SingularArg).type;
            const castedArgValue = castArgValue(argValue, argValueType);

            if (castedArgValue === null) {
              throw new ClimpError({
                message: ErrorMessage.WRONG_ARG_TYPE(
                  argName,
                  argValueType,
                  argValue
                ),
              });
            }

            argObj[strippedArgName] = castedArgValue;

            ++index;

            break;
          }
        }
      } else {
        /*
          Positional arg
        */

        const argValue = commandArgs[index];

        if (posArgIndex >= posArgs.length) {
          throw new ClimpError({
            message: ErrorMessage.TOO_MANY_POS_ARGS(argValue, posArgs.length),
          });
        }

        const posArg = posArgs[posArgIndex];
        const {name: posArgName = posArgIndex, type: argValueType} = isType(
          posArg
        )
          ? {type: posArg}
          : posArg;

        const castedArgValue = castArgValue(argValue, argValueType);

        if (castedArgValue === null) {
          throw new ClimpError({
            message: ErrorMessage.WRONG_POS_ARG_TYPE(
              index,
              posArgIndex,
              argValueType,
              argValue
            ),
          });
        }

        argObj[posArgName] = castedArgValue;

        ++posArgIndex;
      }

      ++index;
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
