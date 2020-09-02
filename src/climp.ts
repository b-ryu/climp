import ClimpError from './errors';

import type {ClimpConfig} from './types';

export default function (config: ClimpConfig) {
  const {commands} = config;

  // TODO validate commands

  return (cliArgs: string[]) => {
    if (cliArgs.length === 0) {
      // TODO write some more specific errors
      throw new ClimpError({message: `You didn't pass in any arguments!`});
    }

    const [commandName, ...passedInArgs] = cliArgs;
    const command = commands[commandName];

    if (command == undefined) {
      throw new ClimpError({
        message: `${commandName} is not a recognized command`,
      });
    }

    const {
      func: commandFunc,
      args: commandArgs,
      positionalArgs: commandPosArgs,
    } = command;
    const args = {...commandArgs, ...(config?.global?.args || {})};
    const posArgs = [
      ...(config?.global?.positionalArgs || []),
      ...commandPosArgs,
    ].map((posArg) => ({...posArg, used: false}));

    return '';
  };
}
