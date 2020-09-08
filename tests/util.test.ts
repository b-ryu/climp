import {
  stripArgName,
  isArgName,
  argType,
  castArgValue,
  isType,
  normalizePositionalArgs,
  requiredNumOfArgs,
} from '../src/util';

import type {
  BoolArg,
  SingularArg,
  FiniteArg,
  InfiniteArg,
  PositionalArg,
  PostionalArgsDescriptor,
} from '../src/types';

describe('util', () => {
  describe('stripArgName', () => {
    it('strips argument prefix from arg names', () => {
      const argName = '--test';

      expect(stripArgName(argName)).toEqual('test');
    });
  });

  describe('isArgName', () => {
    it('returns true if the passed string is an arg name', () => {
      const argName = '--test';

      expect(isArgName(argName)).toBe(true);
    });

    it('returns false if the passed string is not an arg name', () => {
      const argName = '-test';

      expect(isArgName(argName)).toBe(false);
    });
  });

  describe('argType', () => {
    it('correctly returns arg type for boolean arg', () => {
      const boolArg: BoolArg = {type: 'boolean'};

      expect(argType(boolArg)).toEqual('boolean');
    });

    it('correctly returns arg type for singular arg', () => {
      const singArg: SingularArg = {type: 'string'};

      expect(argType(singArg)).toEqual('singular');
    });

    it('correctly returns arg type for finite arg', () => {
      const finiteArg: FiniteArg = {types: ['string']};

      expect(argType(finiteArg)).toEqual('finite');
    });

    it('correctly returns arg type for infinite arg', () => {
      const infiniteArg: InfiniteArg = {types: 'string'};

      expect(argType(infiniteArg)).toEqual('infinite');
    });
  });

  describe('castArgValue', () => {
    it('correctly casts number args', () => {
      const value = '2';

      expect(castArgValue(value, 'string')).toEqual('2');
      expect(castArgValue(value, 'number')).toEqual(2);
      expect(castArgValue(value, 'cast')).toEqual(2);
      expect(castArgValue(value, 'boolean')).toEqual(null);
    });

    it('correctly casts boolean args', () => {
      const value = 'true';

      expect(castArgValue(value, 'string')).toEqual('true');
      expect(castArgValue(value, 'number')).toEqual(null);
      expect(castArgValue(value, 'cast')).toEqual(true);
      expect(castArgValue(value, 'boolean')).toEqual(true);
    });
  });

  describe('isType', () => {
    it('determines if a type pos arg is a type', () => {
      const posArg: PositionalArg = 'boolean';

      expect(isType(posArg)).toBe(true);
    });

    it('determines if a non-type pos arg is a type', () => {
      const posArg: PositionalArg = {name: 'arg', type: 'boolean'};

      expect(isType(posArg)).toBe(false);
    });
  });

  describe('normalizePositionalArgs', () => {
    it('returns already normalized pos arg descriptors', () => {
      const posArgDescriptors: PostionalArgsDescriptor = [
        {name: 'arg1', type: 'string'},
        'string',
        {name: 'arg2', type: 'boolean'},
      ];
      const defaultMax = 10;

      expect(normalizePositionalArgs(posArgDescriptors, defaultMax)).toBe(
        posArgDescriptors
      );
    });

    it('normalizes pos arg descriptors using default maximum', () => {
      const posArgDescriptors: PostionalArgsDescriptor = {types: 'boolean'};
      const defaultMax = 10;

      expect(
        normalizePositionalArgs(posArgDescriptors, defaultMax)
      ).toStrictEqual(Array(defaultMax).fill('boolean'));
    });

    it('normalizes pos arg descriptors using configured maximum', () => {
      const max = 15;
      const posArgDescriptors: PostionalArgsDescriptor = {
        types: 'boolean',
        max,
      };
      const defaultMax = 10;

      expect(
        normalizePositionalArgs(posArgDescriptors, defaultMax)
      ).toStrictEqual(Array(max).fill('boolean'));
    });
  });

  describe('requiredNumOfArgs', () => {
    it('returns the length of a finite array if passed in', () => {
      const posArgs: PostionalArgsDescriptor = [
        'string',
        'boolean',
        {name: 'arg', type: 'cast'},
      ];

      expect(requiredNumOfArgs(posArgs)).toEqual(3);
    });

    it('returns the minimum of a descriptor if passed in', () => {
      const posArgs: PostionalArgsDescriptor = {
        types: 'string',
        min: 2,
      };

      expect(requiredNumOfArgs(posArgs)).toEqual(2);
    });

    it('returns zero if neither a minimum nor finite length is passed in', () => {
      const posArgs: PostionalArgsDescriptor = {
        types: 'string',
      };

      expect(requiredNumOfArgs(posArgs)).toEqual(0);
    });
  });
});
