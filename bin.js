#!/usr/bin/env node
const chalk = require('chalk');
const yargs = require('yargs');
const {seed} = require('./');

const {_: [path]} = yargs.argv;

seed(path, log => {
  console.log(log);
}, true)
.catch(error => {
  console.log(`⚠️  ${chalk.bgRed(` ${error.message} `)}`);
  process.exit(1);
})