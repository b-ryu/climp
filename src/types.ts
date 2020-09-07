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

export type Type = 'boolean' | 'string' | 'number' | 'cast';

export type Arg = BoolArg | SingularArg | FiniteArg | InfiniteArg;

interface BasicArg {
  required?: boolean;
}

// Note that boolean args (or "flags") can't be "required" in the usual sense;
// including it counts as "true", omitting it counts as "false"
interface BoolArg extends BasicArg {
  type: 'boolean';
  required?: false;
}

// TODO make arg types optional, use defaults (e.g. "cast" and SingularArg)

export interface SingularArg extends BasicArg {
  type: Exclude<Type, 'boolean'>;
}

export interface FiniteArg extends BasicArg {
  types: Type[];
}

export interface InfiniteArg extends BasicArg {
  types: Type;
  min?: number;
  max?: number;
}

// TODO rethink pos args strategy
// Named args
interface PositionalArg extends BasicArg {
  name?: string | number;
  type?: Type;
}

// // Error messages
// interface ErrorMessages {}

// // Logging
// type Logger = any;
