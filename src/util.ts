import {ARGUMENT_PREFIX, DEFAULT_COMMAND_NAME, ErrorMessage} from './constants';
import PosArgs from './PosArgs';
import ClimpError from './errors';

import type {
  Arg,
  Type,
  PositionalArg,
  PositionalArgsDescriptor,
  ClimpConfig,
  Command,
  ArgValue,
} from './types';

export function stripArgName(argName: string) {
  return argName.substring(ARGUMENT_PREFIX.length);
}

export function isArgName(arg: string) {
  return arg.startsWith(ARGUMENT_PREFIX);
}

export function argType(arg: Arg) {
  if ('type' in arg) {
    return arg.type === 'boolean' ? 'boolean' : 'singular';
  } else {
    return Array.isArray(arg.types) ? 'finite' : 'infinite';
  }
}

// Returns null if argValue cannot be properly casted
export function castArgValue(argValue: string, type: Type) {
  if (type === 'boolean' || type === 'cast') {
    switch (argValue.toLowerCase()) {
      case 'true':
        return true;
      case 'false':
        return false;
      default:
        if (type === 'boolean') return null;
    }
  }

  if (type === 'number' || type === 'cast') {
    const numberValue = Number(argValue);

    if (isNaN(numberValue)) {
      if (type === 'number') return null;
    } else {
      return numberValue;
    }
  }

  return argValue;
}

export function isType(positionalArg: PositionalArg): positionalArg is Type {
  return typeof positionalArg === 'string';
}

export function normalizePositionalArgs(
  positionalArgs: PositionalArgsDescriptor = [],
  defaultMax: number
): PositionalArg[] {
  if (Array.isArray(positionalArgs)) {
    return positionalArgs;
  }

  const {types, max = defaultMax} = positionalArgs;

  return Array(max).fill(types);
}

export function minimumPosArgs(posArgs: PositionalArgsDescriptor = []) {
  if (Array.isArray(posArgs)) {
    return posArgs.length;
  }

  return posArgs.min || 0;
}

export function maximumPosArgs(
  posArgs: PositionalArgsDescriptor = [],
  defaultMax: number
) {
  if (Array.isArray(posArgs)) {
    return posArgs.length;
  }

  return posArgs.max || defaultMax;
}

/*
  Derive a command and its options from a list of args and a config
*/
export function getCommandArgs(
  args: string[],
  config: ClimpConfig
): [Command, string[]] {
  const {commands} = config;
  const [firstArg, ...restArgs] = args;

  if (firstArg === undefined) {
    if (commands[DEFAULT_COMMAND_NAME]) {
      return [commands[DEFAULT_COMMAND_NAME], []];
    } else {
      throw new ClimpError({
        message: ErrorMessage.NO_ARGS(),
      });
    }
  } else if (commands[firstArg]) {
    return [commands[firstArg], restArgs];
  } else if (commands[DEFAULT_COMMAND_NAME]) {
    return [commands[DEFAULT_COMMAND_NAME], args];
  } else {
    throw new ClimpError({
      message: ErrorMessage.UNRECOGNIZED_COMMAND(firstArg),
    });
  }
}

/*
  Derive consolidated args/positional args for a given command
*/
export function getArgs(
  command: Command,
  config: ClimpConfig
): [Record<string, Arg>, PosArgs] {
  const {
    args: cArgs = {},
    positionalArgs: {
      optional: cOptPosArgs = [],
      required: cReqPosArgs = [],
    } = {},
  } = command;
  const {
    global: {
      args: gArgs = {},
      positionalArgs: {
        optional: gOptPosArgs = [],
        required: gReqPosArgs = [],
      } = {},
    } = {},
  } = config;

  return [
    {
      ...cArgs,
      ...gArgs,
    },
    new PosArgs(gReqPosArgs, cReqPosArgs, gOptPosArgs, cOptPosArgs),
  ];
}

export function parseArgs(
  argName: string,
  parseIndex: number,
  commandArgs: string[],
  types: Type[],
  strict = true
): ArgValue[] {
  const values: ArgValue[] = [];

  while (values.length < types.length) {
    const valIndex = values.length;
    const valType = types[valIndex];
    const valParseIndex = parseIndex + valIndex + 1;

    if (valParseIndex >= commandArgs.length) {
      if (strict) {
        throw new ClimpError({
          message: ErrorMessage.WRONG_NUMBER_OF_ARG_VALUES(
            argName,
            types.length,
            valIndex
          ),
        });
      }

      break;
    }

    const value = commandArgs[valParseIndex];

    if (isArgName(value)) {
      if (strict) {
        throw new ClimpError({
          message: ErrorMessage.ARG_NAME_VALUE(value, argName),
        });
      }

      break;
    }

    const castedArgValue = castArgValue(value, valType);

    if (castedArgValue === null) {
      if (strict) {
        throw new ClimpError({
          message: ErrorMessage.WRONG_ARG_TYPE(argName, valType, value),
        });
      }

      break;
    }

    values.push(castedArgValue);
  }

  return values;
}
