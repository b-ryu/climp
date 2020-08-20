// Config
export interface ClimpConfig {
  commands: Commands;
  global?: {
    flags?: Flags;
    positionalArgs?: PositionalArgs;
  };
}

// Commands
interface Commands {
  [commandName: string]: Command;
}

interface Command {
  func: CommandFunction;
  flags: Flags;
  positionalArgs: PositionalArgs;
}

// Command function
type CommandFunction = any;

// Flags
interface Flags {
  [flagName: string]: Flag;
}

interface Flag {}

// Positional args
type PositionalArgs = PositionalArg[];

interface PositionalArg {}
