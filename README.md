# 🐒 climp

climp is a simple tool to help build Node CLIs.

## Installation

```
yarn add climp
```

## Usage

climp's default export is a function called `climp`, which takes in a config object that describes what you want your CLI to do and look like.

It returns another function that you can then pass arguments to. Your generated CLI function will handle parsing and validating options, and will call the function mapped to each command in your config object.

```js
// my-script.js

const climp = require('climp');

// Import functions from your own code
const {doSomething, doAnotherThing} = require('./my-code');

const cli = climp({
  commands: {
    'do-something': {
      func: doSomething,
      args: {
        argName: {
          type: 'string',
        },
      },
    },
    'do-another-thing': {
      func: doAnotherThing,
    },
  },
});

// ['node', 'my-script.js', 'do-something', '--argName', 'argValue']
const args = [...process.argv];
args.splice(0, 2);

cli(args); // doSomething({argName: 'argValue'})
```

Note that it's up to you to trim off any unwanted arguments (i.e. `node`, `my-script.js`) before passing it to climp's CLI. You might get an error otherwise.

## Config

Below is a more detailed explanation/example of climp's config object:

```js
{
  commands: {
    'command-name': {
      args: {},
      positionalArgs: []
    }
  },
  global: {
    positionalArgs: [],
    args: {
      'arg-name': {
          required: true,
          type: 'number'
      }
    }
  }
}
```

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

In the future I may plan on adding an error-handler config option to help make this a little nicer-looking.

## 🚧 TODO

**Primary features**

- [x] Support infinite positional args
- [x] Support no-args case
- [ ] Support aliases
  - [ ] Support catch-all function for transforming command names
- [ ] Preprocessing/optimizations

**Secondary features/backlog**

- [ ] Built-in/generated `--help` function
- [ ] Greater configurability in general
- [ ] Improved errors
  - [ ] Pass in useful info in error object
  - [ ] More specialized error types
  - [ ] More extensive type errors
- [ ] More specific/useful TS types
- [ ] Config/arg validators
- [ ] Error-handling config

**Project items**

- [ ] Tests
- [ ] Flesh out docs
- [ ] Publish
- [ ] Publish script
- [ ] Use Gitmojis for commits
