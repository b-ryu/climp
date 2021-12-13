import ClimpError from './errors';
import {castArgValue, isType} from './util';
import {ErrorMessage} from './constants';

import type {PositionalArgsDescriptor, Type} from './types';

interface PosArgStack {
  posArgs: PositionalArgsDescriptor;
  maximum: number | null;
  minimum: number;
  count: number;
  optional: boolean;
}

export interface PosArgsParserInterface {
  parse: (value: string) => [string, string | number | boolean];
  minimumMet: () => boolean;
  getTotalNumberReadIn: () => number;
  getTotalMinRequired: () => number;
}

export default (
  reqPosArgs: PositionalArgsDescriptor[],
  optPosArgs: PositionalArgsDescriptor[]
): PosArgsParserInterface => {
  // Normalized data structures for representing "stacks" of positional args
  const posArgsStacks: PosArgStack[] = [...reqPosArgs, ...optPosArgs].map(
    (posArgs, i) => {
      return {
        posArgs,
        maximum: Array.isArray(posArgs) ? posArgs.length : posArgs.max || null,
        minimum: Array.isArray(posArgs) ? posArgs.length : posArgs.min || 0,
        count: 0,
        optional: i >= reqPosArgs.length,
      };
    }
  );

  // Return the current stack
  // The current stack is defined as the stack with space left AND the next stack is empty, if it exists
  const getCurrStack = (): PosArgStack => {
    return posArgsStacks.find((posArgsStack, i) => {
      return (
        (posArgsStack.count < posArgsStack.maximum ||
          posArgsStack.maximum === null) &&
        (i === posArgsStacks.length - 1 || posArgsStacks[i + 1].count === 0)
      );
    });
  };

  const getExpectedNameAndType = (): [string, Type] | null => {
    const currStack = getCurrStack();
    if (!currStack) return null;

    const {posArgs, count} = currStack;
    if (Array.isArray(posArgs)) {
      const posArg = posArgs[count];
      return isType(posArg)
        ? [null, posArg]
        : [posArg.name || null, posArg.type];
    }
    return [null, posArgs.types];
  };

  const bumpCurrStackCount = (): void => {
    getCurrStack().count += 1;
  };

  const topOffCurrStack = (): void => {
    const currStack = getCurrStack();
    currStack.maximum = currStack.count;
  };

  const currStackMinimumMet = (): boolean => {
    const {minimum, count, optional} = getCurrStack();
    return (optional && !count) || count >= minimum;
  };

  const getTotalNumberReadIn = (): number => {
    return posArgsStacks.reduce((prev, {count}) => count + prev, 0);
  };

  const parse = (value: string): [string, string | number | boolean] => {
    const expectedNameAndType = getExpectedNameAndType();
    if (!expectedNameAndType)
      throw new ClimpError({message: ErrorMessage.UNEXPECTED_POS_ARG(value)});
    const [name, expectedType] = expectedNameAndType;

    const castedValue = castArgValue(value, expectedType);

    // If we failed to resolve the arg to the current stack
    if (castedValue === null) {
      if (!currStackMinimumMet())
        throw new ClimpError({
          message: ErrorMessage.UNEXPECTED_POS_ARG(value),
        });
      topOffCurrStack();
      return parse(value);
    }

    const res: [string, string | number | boolean] = [
      name === null ? String(getTotalNumberReadIn()) : name,
      castedValue,
    ];
    bumpCurrStackCount();

    return res;
  };

  const getTotalMinRequired = (): number =>
    posArgsStacks.reduce(
      (prev, {minimum, optional}) => (optional ? prev : prev + minimum),
      0
    );

  const minimumMet = (): boolean => {
    return getTotalNumberReadIn() >= getTotalMinRequired();
  };

  return {
    parse,
    minimumMet,
    getTotalNumberReadIn,
    getTotalMinRequired,
  };
};
