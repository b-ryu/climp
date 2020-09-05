// Config
export interface ClimpConfig {
  commands: Commands;
  global?: {
    args?: Args;
    positionalArgs?: PositionalArgs;
  };
  // strict?: boolean;
  // errorMessages?: ErrorMessages;
  // logger?: Logger;
}

// Commands
type Commands = Record<string, Command>;

interface Command {
  func: CommandFunction;
  args?: Args;
  positionalArgs?: PositionalArgs;
}

type CommandFunction = (args: Record<string, string | number | boolean>) => any;

// Args
type Args = Record<string, Arg>;

interface PositionalArgs {
  required?: PositionalArg[];
  optional?: PositionalArg[];
}

type Type = 'boolean' | 'string' | 'number' | 'cast';

type Arg = BoolArg | SingularArg | FiniteArg | InfiniteArg;

interface BasicArg {
  required?: boolean;
}

// Note that boolean args (or "flags") can't be "required" in the usual sense;
// including it counts as "true", omitting it counts as "false"
interface BoolArg extends BasicArg {
  type: 'boolean';
  required?: false;
}

interface SingularArg extends BasicArg {
  type: Exclude<Type, 'boolean'>;
}

interface FiniteArg extends BasicArg {
  types: Type[];
}

interface InfiniteArg extends BasicArg {
  types: Type;
  max?: number;
}

interface PositionalArg extends BasicArg {
  name: string;
  type?: Type;
}

// // Error messages
// interface ErrorMessages {}

// // Logging
// type Logger = any;
