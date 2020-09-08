import {ARGUMENT_PREFIX} from './constants';

import type {Arg, Type, PositionalArg, PostionalArgsDescriptor} from './types';

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
  positionalArgs: PostionalArgsDescriptor = [],
  defaultMax: number
): PositionalArg[] {
  if (Array.isArray(positionalArgs)) {
    return positionalArgs;
  }

  const {types, max = defaultMax} = positionalArgs;

  return Array(max).fill(types);
}

export function requiredNumOfArgs(posArgs: PostionalArgsDescriptor = []) {
  if (Array.isArray(posArgs)) {
    return posArgs.length;
  }

  return posArgs.min || 0;
}
