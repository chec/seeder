# Chec Seeder

[![Version](https://img.shields.io/npm/v/@chec/seeder.svg)](https://npmjs.org/package/@chec/seeder)
[![License](https://img.shields.io/github/license/chec/seeder.svg)](https://github.com/chec/seeder/blob/master/LICENSE.md)

A small utility to help with seeding data in your Chec dashboard

## Download

```bash
npm install @chec/seeder
```

## Configuring

You can define following properties as environment variables:
- `CHEC_SECRET_KEY` - (required) - Your Chec secret API key.
- `CHEC_API_URL` - (optional) - API URL, defaults to `api.chec.io`.

## Usage

### As a NPM script

Add a seed command to your package.json

```json
{
    "scripts": {
        "seed": "chec-seed path/to/json/files"
    }
}
```

### Global usage

This script can be installed globally:

```bash
npm install -g @chec/seeder
```

Then you can use this helper outside of a project to seed data easily, like so:

```bash
chec-seeder path/to/json/files
```

### Within code

You can also use this package within your Node.js projects:

```js
const seed = require('@chec/seeder');

seed('path/to/json/files');
```
