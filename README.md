# 🐒 climp

[![npm version](https://badge.fury.io/js/climp.svg)](https://badge.fury.io/js/climp)
![ci](https://github.com/b-ryu/climp/workflows/Node.js%20CI/badge.svg)

climp is a simple tool to help build Node CLIs.

## Installation

```
yarn add climp
```

## Usage

climp's default export is a function that takes in a config object describing what you want your CLI to do and look like.

It returns another function that you can then pass arguments to. Your generated CLI function will handle parsing and validating options, and will call the function mapped to each command in your config object.

```js
// my-script.js

const {default: climp} = require('climp');

// Import functions from your own code
const {doSomething, doAnotherThing} = require('./my-code');

const cli = climp({
  commands: {
    'do-something': {
      func: doSomething,
      args: {
        'arg-name': {
          type: 'string',
        },
      },
    },
    'do-another-thing': {
      func: doAnotherThing,
    },
  },
});

// ['node', 'my-script.js', 'do-something', '--arg-name', 'arg-value']
const args = process.argv.slice(2);

cli(args); // doSomething({'arg-name': 'arg-value'})
```

_Note that it's up to you to trim off any unwanted arguments (i.e. `node`, `my-script.js`) before passing it to climp's CLI. You might get an error otherwise._

Check out the tests (`tests/climp.test.ts`) for some more examples on usage.

## Config

> _climp is fully typed, and thus it may be helpful to explore [its type declarations](./src/types.ts)_

Below is a more detailed explanation/example of climp's config object:

```ts
interface Config {
  commands: Commands;
  global?: {
    args?: Args;
    positionalArgs?: PositionalArgs;
  };
}
```

### `commmands`

`commands` is an object you can use to map command names to their `Command` configs.

```ts
interface Command {
  func: CommandFunction;
  args?: Args;
  positionalArgs?: PositionalArgs;
}
```

`func` is the function that will ultimately be called with the parsed argument body. You can specify parsing behaviour with your `args` and `positionalArgs` configs.

#### `Command.args`

`Command.args` refers to your **named args**, that is, the args that are prefixed with `--` and may optionally be followed by associated values.

Named args may be assigned a type, and also a range of number of values that may be accepted alongside it.

For instance, a `BoolArg` needs only a type specification, since the inclusion/exclusion of a boolean flag is meaningful on its own (include it to set it to `true`, exclude it to set it to `false`).

```ts
interface BoolArg extends BasicArg {
  type: 'boolean';
  required?: false;
}
```

A `SingularArg` accepts in a single value after the argument name itself. Thus passing in the arg-value pair `--arg-name arg-value` to your command will set `arg-name` in your final arg body to have the value `arg-value`.

```ts
interface SingularArg extends BasicArg {
  type: Exclude<Type, 'boolean'>;
}
```

`FiniteArg` and `InfiniteArg` are similar, in that you may specify a finite list of `types` to assert upon your values, or accept a range from `min` to `max` values of a given type.

```ts
interface FiniteArg extends BasicArg {
  types: Type[];
}

interface InfiniteArg extends BasicArg {
  types: Type;
  min?: number;
  max?: number;
}
```

#### `Command.positionalArgs`

`Command.positionalArgs` refers to your **positional args**, that is, the args that are imbued meaning via their indexed position within the command string.

Positional args may be either `required` or `optional`, and may be expressed as a list of `PositionalArg`s or a `InfinitePositionalArgs` config object. The latter works similarly to the `InfiniteArg` option in that it accepts a range of value counts.

```ts
type Type = 'boolean' | 'string' | 'number' | 'cast';

interface PositionalArgs {
  required?: PositionalArgsDescriptor;
  optional?: PositionalArgsDescriptor;
}

type PositionalArgsDescriptor = PositionalArg[] | InfinitePositionalArgs;

type PositionalArg = NamedPositionalArg | Type;

// You may choose to label your positional args in the final arg body; otherwise they are given numeric keys
interface NamedPositionalArg {
  name?: string;
  type: Type;
}

interface InfinitePositionalArgs {
  types: Type;
  min?: number;
  max?: number;
}
```

### `global`

`global` is where you can define your CLI's top-level arguments (i.e. the arguments that apply to all your commands). `args` and `positionalArgs` refer to your global named and positional args respectively.

Some notes on parsing behaviour:

- If a global and command named arg share the same name, the **command named arg will take precedence**
- The parsing will prioritize **global positional args** before command positional args. Furthermore, required positional args will be considered first

## Errors

climp also exports `ClimpError` as a named export. It throws `ClimpError`s when it runs into parsing/validating issues, both on `climp` calls and on calls to the returned function returned by `climp`. The intended use case is that the consumer wrap these calls in try-catch blocks so they may define their own error-handling behaviour.

```js
try {
  cli = climp(config);
} catch (e) {
  if (e instanceof ClimpError) {
    // handle climp error (e.g. log, etc.)
  } else {
    // handle other errors
  }
}

try {
  cli(args);
} catch (e) {
  if (e instanceof ClimpError) {
    // handle climp error (e.g. log, etc.)
  } else {
    // handle other errors
  }
}
```
