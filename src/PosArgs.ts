import ClimpError from './errors';
import {minimumPosArgs, castArgValue, isType} from './util';
import {ErrorMessage} from './constants';

import type {PositionalArgsDescriptor, Type} from './types';

/*
  Object to keep track of positional arg parsing
*/
export default class PosArgs {
  readonly minRequired: number;
  readIn: number;

  readonly stacks: PosArgStack[];
  stackIndex: number;
  currentStack: number;
  reqStackIndices: number[];

  constructor(
    gReqPosArgs: PositionalArgsDescriptor, // required args
    cReqPosArgs: PositionalArgsDescriptor, // required args
    gOptPosArgs: PositionalArgsDescriptor,
    cOptPosArgs: PositionalArgsDescriptor
  ) {
    this.readIn = 0;
    this.stackIndex = 0;
    this.currentStack = 0;

    this.minRequired =
      minimumPosArgs(gReqPosArgs) + minimumPosArgs(cReqPosArgs);

    this.stacks = [
      new PosArgStack(gReqPosArgs),
      new PosArgStack(cReqPosArgs),
      new PosArgStack(gOptPosArgs),
      new PosArgStack(cOptPosArgs),
    ];

    this.moveToAvailableStack();

    this.findRequiredArgStacks();
  }

  findRequiredArgStacks = () => {
    this.reqStackIndices = [];

    // Indices 0 and 1 hold the "required" pos args
    // If minimum is 0, then required stacks are considered optional
    if (this.stacks[0].minimum !== 0) {
      this.reqStackIndices.push(0);
    }
    if (this.stacks[1].minimum !== 0) {
      this.reqStackIndices.push(1);
    }
  };

  currentLimitReached = () => {
    return this.stacks[this.currentStack].reachedLimit(this.stackIndex);
  };

  onLastStack = () => {
    return this.currentStack === this.stacks.length - 1;
  };

  parse = (value: string): [string, string | number | boolean] => {
    if (this.currentLimitReached() && this.onLastStack()) {
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

  onOptionalStack = () => {
    return !this.reqStackIndices.includes(this.currentStack);
  };

  incrementStackIndex = () => {
    ++this.stackIndex;
    ++this.readIn;

    this.moveToAvailableStack();
  };

  incrementStack = () => {
    this.stackIndex = 0;
    this.currentStack = Math.min(this.currentStack + 1, this.stacks.length - 1);
  };

  moveToAvailableStack = () => {
    while (
      this.currentLimitReached() &&
      this.currentStack < this.stacks.length - 1
    ) {
      this.stackIndex = 0;
      ++this.currentStack;
    }
  };

  stackMinimumMet = () => {
    if (this.onOptionalStack()) {
      return true;
    }

    return this.stackIndex >= this.stacks[this.currentStack].minimum;
  };

  minimumMet = () => {
    const {stacks, currentStack, stackIndex, reqStackIndices} = this;
    const stack = stacks[currentStack];

    return (
      this.onOptionalStack() ||
      (currentStack === Math.max(...reqStackIndices) &&
        stackIndex >= stack.minimum)
    );
  };
}

class PosArgStack {
  readonly length: number | null;
  readonly posArgs: PositionalArgsDescriptor;
  readonly minimum: number;

  constructor(posArgs: PositionalArgsDescriptor) {
    this.posArgs = posArgs;
    this.length = Array.isArray(posArgs) ? posArgs.length : posArgs.max || null;
    this.minimum = Array.isArray(posArgs) ? posArgs.length : posArgs.min || 0;
  }

  reachedLimit = (index: number) => {
    const {length} = this;

    return length === null ? false : index >= length;
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
