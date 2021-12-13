import {ARGUMENT_PREFIX, DEFAULT_COMMAND_NAME, ErrorMessage} from './constants';
import PosArgsParser from './posargs';
import type {PosArgsParserInterface} from './posargs';
import ClimpError from './errors';

import type {
  Arg,
  Type,
  PositionalArg,
  ClimpConfig,
  Command,
  ArgValue,
} from './types';

// Strips a prefix from a named arg (e.g. --<arg> => <arg>)
export function stripArgName(argName: string) {
  return argName.substring(ARGUMENT_PREFIX.length);
}

// Returns true if an arg is a named arg (i.e. starts with '--')
export function isArgName(arg: string) {
  return arg.startsWith(ARGUMENT_PREFIX);
}

// Returns the arg type
export function argType(arg: Arg) {
  if ('type' in arg) {
    return arg.type === 'boolean' ? 'boolean' : 'singular';
  } else {
    return Array.isArray(arg.types) ? 'finite' : 'infinite';
  }
}

function castBooleanArgValue(argValue: string): boolean | null {
  switch (argValue.toLowerCase()) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return null;
  }
}

function castNumberArgValue(argValue: string): number | null {
  const numberValue = Number(argValue);
  return isNaN(numberValue) ? null : numberValue;
}

// Casts an arg value to a type, if possible
export function castArgValue(argValue: string, type: Type) {
  switch (type) {
    case 'boolean': {
      return castBooleanArgValue(argValue);
    }
    case 'number': {
      return castNumberArgValue(argValue);
    }
    case 'cast': {
      const castedBooleanArgValue = castBooleanArgValue(argValue);
      if (castedBooleanArgValue !== null) return castedBooleanArgValue;
      const castedNumberArgValue = castNumberArgValue(argValue);
      if (castedNumberArgValue !== null) return castedNumberArgValue;
    }
    default:
      // string
      return argValue;
  }
}

export function isType(positionalArg: PositionalArg): positionalArg is Type {
  return typeof positionalArg === 'string';
}

// Splits a list of params into a commnad name and command args
export function splitCommandAndArgs(
  args: string[],
  config: ClimpConfig
): [Command, string[]] {
  const {commands} = config;
  const [firstArg, ...restArgs] = args;

  // If no args were passed in at all...
  if (args.length === 0) {
    if (commands[DEFAULT_COMMAND_NAME]) {
      return [commands[DEFAULT_COMMAND_NAME], []];
    } else {
      throw new ClimpError({message: ErrorMessage.NO_ARGS()});
    }
  }

  // If arg is provided then we return that plus the remainder of the args
  if (commands[firstArg]) return [commands[firstArg], restArgs];

  // If arg is not provided then we presume the default plus the total list of args
  if (commands[DEFAULT_COMMAND_NAME])
    return [commands[DEFAULT_COMMAND_NAME], args];

  throw new ClimpError({
    message: ErrorMessage.UNRECOGNIZED_COMMAND(firstArg),
  });
}

// Gets the global and positional args for a given command based on the config
export function getCommandArgConfig(
  command: Command,
  config: ClimpConfig
): [Record<string, Arg>, PosArgsParserInterface] {
  const {
    args: commandArgs = {},
    positionalArgs: {
      optional: commandOptPosArgs = [],
      required: commandReqPosArgs = [],
    } = {},
  } = command;
  const {
    global: {
      args: globalArgs = {},
      positionalArgs: {
        optional: globalOptPosArgs = [],
        required: globalReqPosArgs = [],
      } = {},
    } = {},
  } = config;

  return [
    {
      ...globalArgs,
      ...commandArgs, // command args should override globals if defined
    },
    PosArgsParser(
      [globalReqPosArgs, commandReqPosArgs], // we should parse global args first, command args next
      [globalOptPosArgs, commandOptPosArgs]
    ),
  ];
}

// Given an arg name, an arg index, and a list of args, returns a list of values for that arg
// with specified types
export function parseArgValues(
  argName: string,
  parseIndex: number,
  commandArgs: string[],
  types: Type[],
  strict = true
): ArgValue[] {
  const values: ArgValue[] = [];

  try {
    while (values.length < types.length) {
      const valIndex = values.length;
      const valType = types[valIndex];
      const valParseIndex = parseIndex + valIndex + 1;

      if (valParseIndex >= commandArgs.length) {
        throw new ClimpError({
          message: ErrorMessage.WRONG_NUMBER_OF_ARG_VALUES(
            argName,
            types.length,
            valIndex
          ),
        });
      }
      const value = commandArgs[valParseIndex];
      if (isArgName(value)) {
        throw new ClimpError({
          message: ErrorMessage.ARG_NAME_VALUE(value, argName),
        });
      }
      const castedArgValue = castArgValue(value, valType);
      if (castedArgValue === null) {
        throw new ClimpError({
          message: ErrorMessage.WRONG_ARG_TYPE(argName, valType, value),
        });
      }
      values.push(castedArgValue);
    }
  } catch (e) {
    if (strict || !(e instanceof ClimpError)) {
      throw e;
    }
  }

  return values;
}
