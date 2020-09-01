# 🐒 climp

climp is a simple tool to help build Node CLIs.

## Installation

```
yarn add climp
```

## Screenshots

[TODO: add screenshots]()

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

cli(args); // doSomething({argName: argValue})
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
  }
  global: {
    positionalArgs: [],
    args: {
      'arg-name': {
          options: [],
          required: true,
          type: 'number'
      }
    }
  },
  errorMessages: {},
  logger: console.log
}
```
