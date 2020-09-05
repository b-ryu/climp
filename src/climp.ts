import ClimpError from './errors';

import type {ClimpConfig} from './types';

function stripArgName(argName: string) {
  return argName.substring(2);
}

function isArgName(arg: string) {
  return arg.startsWith('--');
}

export default function (config: ClimpConfig) {
  const {commands} = config;

  // TODO validate commands/args
  // i.e. no spaces in names, no out-of-order required positional args

  return (cliArgs: string[]) => {
    if (cliArgs.length === 0) {
      // TODO write some more specific errors
      throw new ClimpError({message: `You didn't pass in any arguments!`});
    }

    const [commandName, ...commandArgs] = cliArgs;
    const command = commands[commandName];

    if (command == undefined) {
      throw new ClimpError({
        message: `${commandName} is not a recognized command`,
      });
    }

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
    let index = 0;
    const argObj = {};

    while (index < commandArgs.length) {
      if (isArgName(commandArgs[index])) {
        //
      } else {
        //
      }

      ++index;
    }

    // Check for unused args
    Object.keys(args).forEach((argName) => {
      if (args[argName].required && argObj[argName] == undefined) {
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

    command.func(argObj);
  };
}
