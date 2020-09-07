// TODO support aliasing
// TODO preprocess/validate config (i.e. validate arg names, argTypes, generate defaults, normalizePositionalArgs, no duplicate names)
// TODO make arg types optional, use defaults (e.g. "cast" and SingularArg)
// TODO preprocess cliArgs (i.e. stripArgName, isArgName)
// TODO extract code to trim down this file's line count
// TODO extract out nameless command key into const
// TODO improve naming
// TODO make this prefix configurable
// TODO make string arg validation configurable (i.e. "strict" arg values)
// TODO emit warnings

import ClimpError from './errors';
import {
  stripArgName,
  isArgName,
  argType,
  castArgValue,
  isType,
  normalizePositionalArgs,
  getMinPosArgs,
} from './util';

import type {ClimpConfig, SingularArg, FiniteArg, InfiniteArg} from './types';

export default function (config: ClimpConfig) {
  return (cliArgs: string[] = []) => {
    const [commandName, ...commandArgs] = cliArgs;
    const command = config.commands[commandName] || config.commands['_'];

    if (command == undefined) {
      if (commandName === undefined) {
        throw new ClimpError({
          message: `No arguments provided, and default command does not exist`,
        });
      } else {
        throw new ClimpError({
          message: `${commandName} is not a recognized command`,
        });
      }
    }

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
    let posArgIndex = 0;

    // Parse args
    const argObj = {};

    let index = 0;

    while (index < commandArgs.length) {
      if (isArgName(commandArgs[index])) {
        const argName = commandArgs[index];
        const strippedArgName = stripArgName(argName);
        const arg = args[strippedArgName];

        if (arg == undefined) {
          throw new ClimpError({
            message: `Argument "${argName}" is not recognized`,
          });
        }

        switch (argType(arg)) {
          case 'boolean': {
            argObj[strippedArgName] = true;

            break;
          }
          case 'finite': {
            const argTypes = (arg as FiniteArg).types;
            const argValues = [];

            argTypes.forEach((type, argIndex) => {
              if (index + argIndex >= commandArgs.length - 1) {
                throw new ClimpError({
                  message: `Argument "${argName}" expects ${argTypes.length} values; ${argIndex} provided`,
                });
              }

              const argValue = commandArgs[index + argIndex + 1];

              if (isArgName(argValue)) {
                throw new ClimpError({
                  message: `You cannot pass "${argValue}" to argument "${argName}"; the "--" prefix is reserved for CLI options`,
                });
              }

              const castedArgValue = castArgValue(argValue, type);

              if (castedArgValue === null) {
                throw new ClimpError({
                  message: `Argument "${argName}" expected a value of type "${type}", but was given "${argValue}"`,
                });
              }

              argValues.push(castedArgValue);
            });

            argObj[strippedArgName] = argValues;

            index += argTypes.length;

            break;
          }
          case 'infinite': {
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
                  message: `Argument "${argName}" expected a value of type "${argType}", but was given "${argValue}"`,
                });
              }

              argValues.push(castedArgValue);
            }

            if (argValues.length < min) {
              throw new ClimpError({
                message: `Argument "${argName}" expected a minimum of ${min} values, but was given ${argValues.length}`,
              });
            }

            argObj[strippedArgName] = argValues;

            index += argValues.length;

            break;
          }
          case 'singular': {
            if (index >= commandArgs.length - 1) {
              throw new ClimpError({
                message: `Argument "${argName}" expects a value; none was provided`,
              });
            }

            const argValue = commandArgs[index + 1];

            if (isArgName(argValue)) {
              throw new ClimpError({
                message: `You cannot pass "${argValue}" to argument "${argName}"; the "--" prefix is reserved for CLI options`,
              });
            }

            const argValueType = (arg as SingularArg).type;
            const castedArgValue = castArgValue(argValue, argValueType);

            if (castedArgValue === null) {
              throw new ClimpError({
                message: `Argument "${argName}" expected a value of type "${argValueType}", but was given "${argValue}"`,
              });
            }

            argObj[strippedArgName] = castedArgValue;

            ++index;

            break;
          }
        }
      } else {
        const argValue = commandArgs[index];

        // Positional args
        if (posArgIndex >= posArgs.length) {
          throw new ClimpError({
            message: `Extra positional argument "${argValue}" was provided; only at most ${posArgs.length} expected`,
          });
        }

        const posArg = posArgs[posArgIndex];
        const {
          name: strippedArgName = posArgIndex,
          type: argValueType,
        } = isType(posArg) ? {type: posArg} : posArg;

        const castedArgValue = castArgValue(argValue, argValueType);

        if (castedArgValue === null) {
          throw new ClimpError({
            message: `Positional argument ("${strippedArgName}", at index ${index}:${posArgIndex}) expected a value of type "${argValueType}", but was given "${argValue}"`,
          });
        }

        argObj[strippedArgName] = castedArgValue;

        ++posArgIndex;
      }

      ++index;
    }

    // Check for unused args
    Object.keys(args).forEach((argName) => {
      if (
        argType(args[argName]) !== 'boolean' &&
        args[argName].required &&
        argObj[argName] == undefined
      ) {
        throw new ClimpError({
          message: `Argument "${argName}" is required but was not passed in`,
        });
      }
    });

    const totalRequiredPosArgs =
      getMinPosArgs(config?.global?.positionalArgs?.required) +
      getMinPosArgs(command.positionalArgs?.required);
    if (posArgIndex < totalRequiredPosArgs - 1) {
      throw new ClimpError({
        message: `${totalRequiredPosArgs} positional arguments were required but only ${posArgIndex} were passed in`,
      });
    }

    return command.func(argObj);
  };
}
