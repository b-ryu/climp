import ClimpError from './errors';
import {stripArgName, isArgName, argType, castArgValue} from './util';

import type {ClimpConfig, SingularArg, FiniteArg, InfiniteArg} from './types';

export default function (config: ClimpConfig) {
  // TODO preprocess/validate config (i.e. no spaces/weird characters in names, argTypes, duplicate names)

  return (cliArgs: string[]) => {
    if (cliArgs.length === 0) {
      // TODO write some more specific errors
      throw new ClimpError({message: `You didn't pass in any arguments!`});
    }

    const [commandName, ...commandArgs] = cliArgs;
    const command = config.commands[commandName];

    // TODO improve naming
    // TODO preprocess passed-in cliArgs (i.e. isArgName, stripArgName)

    if (command == undefined) {
      throw new ClimpError({
        message: `${commandName} is not a recognized command`,
      });
    }

    // TODO lift some of this outside of closure
    const args = {
      ...(command.args || {}),
      ...(config?.global?.args || {}),
    };
    const posArgs = [
      ...(config?.global?.positionalArgs?.required || []),
      ...(command.positionalArgs?.required || []),
      ...(config?.global?.positionalArgs?.optional || []),
      ...(command.positionalArgs?.optional || []),
    ];
    let firstUnused = 0;

    // Parse args
    const argObj = {};

    let index = 0;

    while (index < commandArgs.length) {
      if (isArgName(commandArgs[index])) {
        // Named args

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

              // TODO make this configurable (i.e. "strict" arg values)
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

              // TODO make this configurable (i.e. "strict" arg values)
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

            // TODO make this configurable (i.e. "strict" arg values)
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
        if (firstUnused >= posArgs.length - 1) {
          throw new ClimpError({
            message: `Extra positional argument "${argValue}" was provided; only at most ${posArgs.length} expected`,
          });
        }

        const {
          name: strippedArgName = firstUnused,
          type: argValueType,
        } = posArgs[firstUnused];

        const castedArgValue = castArgValue(argValue, argValueType);

        if (castedArgValue === null) {
          throw new ClimpError({
            message: `Positional argument ("${strippedArgName}", at index ${index}:${firstUnused}) expected a value of type "${argValueType}", but was given "${argValue}"`,
          });
        }

        argObj[strippedArgName] = castedArgValue;

        ++firstUnused;
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

    if (firstUnused < posArgs.length && posArgs[firstUnused].required) {
      throw new ClimpError({
        message: `Positional argument "${posArgs[firstUnused].name}" is required but was not passed in (arg index: ${firstUnused})`,
      });
    }

    return command.func(argObj);
  };
}
