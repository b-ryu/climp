import ClimpError from './errors';
import {castArgValue, isType} from './util';
import {ErrorMessage} from './constants';

import type {PositionalArgsDescriptor, Type} from './types';

export default class PosArgs {
  readonly minRequired: number;
  readIn: number;

  private readonly stacks: PosArgStack[];
  private stackIndex: number;
  private currentStack: number;

  constructor(
    reqPosArgs: PositionalArgsDescriptor[],
    optPosArgs: PositionalArgsDescriptor[]
  ) {
    this.readIn = 0;
    this.stackIndex = 0;
    this.currentStack = 0;

    const reqPosArgStacks = reqPosArgs.map(
      (posArgs) => new PosArgStack(posArgs)
    );
    const optPosArgStacks = optPosArgs.map(
      (posArgs) => new PosArgStack(posArgs)
    );

    this.stacks = [...reqPosArgStacks, ...optPosArgStacks];

    this.minRequired = reqPosArgStacks.reduce(
      (min, stack) => stack.minimum + min,
      0
    );

    this.moveToAvailableStack();
  }

  parse = (value: string): [string, string | number | boolean] => {
    if (this.stackMaximumReached() && this.onLastStack()) {
      throw new ClimpError({message: ErrorMessage.UNEXPECTED_POS_ARG(value)});
    }

    const {currentStack, stacks, stackIndex} = this;
    const stack = stacks[currentStack];

    const [name, type] = stack.getNameAndType(stackIndex);
    const castedArgValue = castArgValue(value, type);

    if (castedArgValue === null) {
      if (!this.stackMinimumMet()) {
        throw new ClimpError({message: ErrorMessage.UNEXPECTED_POS_ARG(value)});
      }

      this.incrementStack();

      return this.parse(value);
    } else {
      const result: [string, string | number | boolean] = [
        name === null ? String(this.readIn) : name,
        castedArgValue,
      ];

      this.incrementStackIndex();

      return result;
    }
  };

  minimumMet = () => {
    return this.readIn >= this.minRequired;
  };

  private onLastStack = () => {
    return this.currentStack >= this.stacks.length - 1;
  };

  private incrementStackIndex = (i = 1) => {
    this.stackIndex += i;
    this.readIn += i;

    this.moveToAvailableStack();
  };

  private incrementStack = (i = 1) => {
    this.stackIndex = 0;
    this.currentStack = Math.min(this.currentStack + i, this.stacks.length - 1);

    this.moveToAvailableStack();
  };

  private moveToAvailableStack = () => {
    while (this.stackMaximumReached() && !this.onLastStack()) {
      this.stackIndex = 0;
      ++this.currentStack;
    }
  };

  private stackMinimumMet = () => {
    if (this.minimumMet()) {
      return true;
    }

    return this.stackIndex >= this.stacks[this.currentStack].minimum;
  };

  private stackMaximumReached = () => {
    const {stacks, currentStack, stackIndex} = this;

    return stacks[currentStack].reachedLimit(stackIndex);
  };
}

class PosArgStack {
  private readonly maximum: number | null;
  private readonly posArgs: PositionalArgsDescriptor;
  readonly minimum: number;

  constructor(posArgs: PositionalArgsDescriptor) {
    this.posArgs = posArgs;
    this.maximum = Array.isArray(posArgs)
      ? posArgs.length
      : posArgs.max || null;
    this.minimum = Array.isArray(posArgs) ? posArgs.length : posArgs.min || 0;
  }

  reachedLimit = (index: number) => {
    const {maximum} = this;

    return maximum === null ? false : index >= maximum;
  };

  getNameAndType = (index: number): [string, Type] => {
    const {posArgs} = this;

    if (Array.isArray(posArgs)) {
      const posArg = posArgs[index];

      return isType(posArg)
        ? [null, posArg]
        : [posArg.name || null, posArg.type];
    } else {
      return [null, posArgs.types];
    }
  };
}
