import type {Arg, Type, PositionalArg} from './types';

export function stripArgName(argName: string) {
  return argName.substring(2);
}

// TODO make this prefix configurable
export function isArgName(arg: string) {
  return arg.startsWith('--');
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
