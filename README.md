# Chec Seeder

[![Version](https://img.shields.io/npm/v/@chec/seeder.svg)](https://npmjs.org/package/@chec/seeder)
[![License](https://img.shields.io/github/license/chec/seeder.svg)](https://github.com/chec/seeder/blob/master/LICENSE.md)

A small utility to help with seeding data in your Chec dashboard

## Download

```
npm install @chec/seeder
```

## Usage

### As a NPM script

Add a seed command to your package.json

```
{
    "scripts": {
        "seed": "chec-seed path/to/json/files"
    }
}
```

A Chec secret API key must be available in as the environment variable `CHEC_API_KEY` to use for seeding. The script is compatible with [dotenv](https://www.npmjs.com/package/dotenv).

If you want to fail the execution if any seed call returns an error, provide environment variable `FAIL_EARLY=true`

### Global usage

This script can be installed globally:

```
npm install -g @chec/seeder
```

Then you can use this helper outside of a project to seed data easily.

### Within code

You can also use this package within your Node.js projects:

```
const seed = require('@chec/seeder');

seed('path/to/json/files');
```
