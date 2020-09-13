import {
  stripArgName,
  isArgName,
  argType,
  castArgValue,
  isType,
} from '../src/util';

import type {
  BoolArg,
  SingularArg,
  FiniteArg,
  InfiniteArg,
  PositionalArg,
  PositionalArgsDescriptor,
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
});
