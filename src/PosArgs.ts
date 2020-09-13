import ClimpError from './errors';
import {castArgValue, isType} from './util';
import {ErrorMessage} from './constants';

import type {PositionalArgsDescriptor, Type} from './types';

/*
  Object to keep track of positional arg parsing
*/
export default class PosArgs {
  readonly minRequired: number;
  readIn: number;

  private readonly stacks: PosArgStack[];
  private stackIndex: number;
  private currentStack: number;

  constructor(
    gReqPosArgs: PositionalArgsDescriptor, // required args
    cReqPosArgs: PositionalArgsDescriptor, // required args
    gOptPosArgs: PositionalArgsDescriptor,
    cOptPosArgs: PositionalArgsDescriptor
  ) {
    this.readIn = 0;
    this.stackIndex = 0;
    this.currentStack = 0;

    this.stacks = [
      new PosArgStack(gReqPosArgs),
      new PosArgStack(cReqPosArgs),
      new PosArgStack(gOptPosArgs),
      new PosArgStack(cOptPosArgs),
    ];

    this.minRequired = this.stacks[0].minimum + this.stacks[1].minimum;

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
      this.moveToAvailableStack();

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

  private incrementStackIndex = () => {
    ++this.stackIndex;
    ++this.readIn;

    this.moveToAvailableStack();
  };

  private incrementStack = () => {
    this.stackIndex = 0;
    this.currentStack = Math.min(this.currentStack + 1, this.stacks.length - 1);
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
