// Config
export interface ClimpConfig {
  commands: Commands;
  global?: {
    args?: Args;
    positionalArgs?: PositionalArgs;
  };
}

// Commands
export type Commands = Record<string, Command>;

export interface Command {
  func: CommandFunction;
  args?: Args;
  positionalArgs?: PositionalArgs;
}

export type ArgObj = Record<string, string | number | boolean>;

export type CommandFunction = (args: ArgObj) => any;

// Types
export type Type = 'boolean' | 'string' | 'number' | 'cast';

// Args
export type Args = Record<string, Arg>;

export type Arg = BoolArg | SingularArg | FiniteArg | InfiniteArg;

export interface BasicArg {
  required?: boolean;
}

// Note that boolean args (or "flags") can't be "required" in the usual sense;
// including it counts as "true", omitting it counts as "false"
export interface BoolArg extends BasicArg {
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

export interface PositionalArgs {
  required?: PositionalArgsDescriptor;
  optional?: PositionalArgsDescriptor;
}

export type PositionalArgsDescriptor = PositionalArg[] | InfinitePositionalArgs;

export type PositionalArg = NamedPositionalArg | Type;

export interface NamedPositionalArg {
  name?: string;
  type: Type;
}

export interface InfinitePositionalArgs {
  types: Type;
  min?: number;
  max?: number;
}
