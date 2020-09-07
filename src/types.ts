// Config
export interface ClimpConfig {
  commands: Commands;
  global?: {
    args?: Args;
    positionalArgs?: PositionalArgs;
  };
}

// Commands
type Commands = Record<string, Command>;

interface Command {
  func: CommandFunction;
  args?: Args;
  positionalArgs?: PositionalArgs;
}

type CommandFunction = (args: Record<string, string | number | boolean>) => any;

// Types
export type Type = 'boolean' | 'string' | 'number' | 'cast';

// Args
type Args = Record<string, Arg>;

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

interface PositionalArgs {
  required?: PostionalArgsDescriptor;
  optional?: PostionalArgsDescriptor;
}

export type PostionalArgsDescriptor = PositionalArg[] | InfinitePositionalArgs;

export type PositionalArg = NamedPositionalArg | Type;

interface NamedPositionalArg {
  name?: string | number;
  type: Type;
}

interface InfinitePositionalArgs {
  types: Type;
  min?: number;
  max?: number;
}
