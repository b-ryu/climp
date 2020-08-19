# 🐒 climp

climp is a simple tool to help build Node CLIs. Originally intended for dogfooding in my own projects.

climp is type-friendly ✨

## Installation

```
yarn add climp
```

## Screenshots

[TODO: add screenshots]()

## Usage

climp's default export is a function called `climp`, which takes in a config object that describes what you want your CLI to do and look like.

It returns another function that you can then pass arguments to. Your generated CLI function will handle parsing and validating flags and options, and will call the function mapped to each command in your config object.

```js
// my-script.js

const climp = require('climp');

// Import functions from your own code
const {doSomething, doAnotherThing} = require('./my-code');

const cli = climp({
  commands: {
    'do-something': {
      func: doSomething,
    },
    'do-another-thing': {
      func: doAnotherThing,
    },
  },
});

// ['node', 'my-script.js', 'do-something', '--flag', 'option']
const args = [...process.argv];
args.splice(0, 2);

cli(args); // doSomething({flag: option})
```

Note that it's up to you to trim off any unwanted arguments (i.e. `node`, `my-script.js`) before passing it to climp's CLI. You might get an error otherwise.

## Config

Below is a more detailed explanation of climp's config object:

```js
{
  commands: {
    'command-name': {
      flags: {},
      positionalArgs: []
    }
  }
  global: {
    positionalArgs: [],
    flags: {
      'flag-name': {
          options: [],
          required: true,
          type: 'number'
      }
    }
  },
  errorMessages: {
    missingArg: (argIndex, args) => ``,
    missingFlag: (flag, args) => ``,
    missingOption: (option, args) => ``,
    generalError: (error, args) => ``
  },
  logger: console.log
}
```
