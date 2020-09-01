// Config
export interface ClimpConfig {
  commands: Commands;
  global?: {
    args?: Args;
    positionalArgs?: PositionalArgs;
  };
  errorMessages?: ErrorMessages;
  logger?: Logger;
}

// Commands
type Commands = Record<string, Command>;

interface Command {
  func: CommandFunction;
  args: Args;
  positionalArgs: PositionalArgs;
}

type CommandFunction = (args: Record<string, string | number | boolean>) => any;

// Args
type Args = Record<string, Arg>;

type PositionalArgs = PositionalArg[];

interface Arg {
  required?: boolean;
}

interface PositionalArg extends Arg {
  name: string;
}

// Error messages
interface ErrorMessages {}

// Logging
type Logger = any;
