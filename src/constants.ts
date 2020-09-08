import {Type} from './types';

export const ARGUMENT_PREFIX = '--';

export const DEFAULT_COMMAND_NAME = '_';

export const ErrorMessage = {
  NO_ARGS: () => `No arguments provided, and default command does not exist`,
  UNRECOGNIZED_COMMAND: (commandName: string) =>
    `${commandName} is not a recognized command`,
  UNRECOGNIZED_ARG: (argName: string) =>
    `Argument "${argName}" is not recognized`,
  WRONG_NUMBER_OF_ARG_VALUES: (
    argName: string,
    required: number,
    given: number
  ) => `Argument "${argName}" expects ${required} values; ${given} provided`,
  WRONG_ARG_TYPE: (argName: string, requiredType: Type, actualValue: string) =>
    `Argument "${argName}" expected a value of type "${requiredType}", but was given "${actualValue}"`,
  NOT_ENOUGH_ARG_VALUES: (argName: string, min: number, given: number) =>
    `Argument "${argName}" expected a minimum of ${min} values, but was given ${given}`,
  NO_ARG_VALUE_PROVIDED: (argName: string) =>
    `Argument "${argName}" expects a value; none was provided`,
  MISSING_REQUIRED_ARG: (argName: string) =>
    `Argument "${argName}" is required but was not passed in`,
  NOT_ENOUGH_POS_ARGS: (required: number, actual: number) =>
    `${required} positional arguments were required but only ${actual} were passed in`,
  ARG_NAME_VALUE: (argValue: string, argName: string) =>
    `You cannot pass "${argValue}" to argument "${argName}"; the "${ARGUMENT_PREFIX}" prefix is reserved for CLI options`,
  UNEXPECTED_POS_ARG: (argValue: string) =>
    `Unexpected positional argument "${argValue}"; please check your command options`,
};
