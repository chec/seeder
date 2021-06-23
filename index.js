require('dotenv').config();

const fs = require('fs');
const {sep} = require('path');
const ora = require('ora');
const chalk = require('chalk');
const PromiseQueue = require('promise-queue');
const got = require('got');
const get = require('lodash.get');

class Seeder {
  constructor(logHandler, showSpinner) {
    this.log = logHandler;
    this.showSpinner = showSpinner
  }

  async run(path = process.cwd()) {
    // Get a list of all seed files in the provided directory
    const entries = Object.entries(this.parsePath(path.replace(new RegExp(`${sep}$`), '')));

    if (entries.length === 0) {
      return this.error('The given path must be a .json file or a directory containing at least one valid .json file');
    }

    // Make categories run first and assets run last
    entries.sort(([a], [b]) => {
      if (a === 'assets' || b === 'categories') {
        return 1;
      }
      if (b === 'assets' || a === 'categories') {
        return -1;
      }
      return 0;
    });

    if (this.showSpinner) {
      this.spinner = ora({
        text: 'Seeding. This may take some time...',
        stream: process.stdout,
      }).start();
    }

    const typeCounts = {};
    const queuedPromises = [];
    const responses = {};
    const queue = new PromiseQueue(1, Infinity);

    entries.forEach(([endpoint, data]) => {
      (Array.isArray(data) ? data : [data]).forEach((datum, index) => {
        const {link, ...rest} = datum;

        queuedPromises.push(queue.add(() => {
            if (this.showSpinner) {
              this.spinner.text = `Seeding ${chalk.dim(endpoint)} #${index}. This may take some time...`;
            }

            // Replace category placeholders with actual category IDs when creating products
            if (endpoint === 'products' && rest.product.category_id) {
              rest.categories = [{ id: get(responses, rest.product.category_id) }];
              rest.product.category_id = undefined;
            }

            return this.post(`/v1/${endpoint}`, rest)
              .then(response => {
                if (Object.hasOwnProperty.call(typeCounts, endpoint)) {
                  typeCounts[endpoint]++;
                } else {
                  responses[endpoint] = [];
                  typeCounts[endpoint] = 1;
                }
                responses[endpoint].push(JSON.parse(response.body))
              })
              .catch(this.apiError);
          }
        ));

        if (endpoint === 'assets' && link) {
          queuedPromises.push(queue.add(() => {
            const assetId = responses.assets[index].id;
            const productId = get(responses, link);

            return this.post(`/v1/products/${productId}/assets`, {
              assets: [{id: assetId}]
            }).catch(this.apiError);
          }))
        }
      });
    });

    await Promise.all(queuedPromises);

    const report = Object.entries(typeCounts);

    if (report.length === 0) {
      if (this.showSpinner) {
        this.spinner.fail('Could not seed any of the provided data');
      }
      return
    }

    if (this.showSpinner) {
      this.spinner.succeed('Completed seeding');
    }
    this.log('Added:');
    report.forEach(([endpoint, count]) => {
      this.log(`  ${chalk.bold(count)} ${endpoint}`);
    })
  }

  apiError = (error) => {
    this.error(`Failed seeding - ${error.message}`);
  }

  parsePath(path) {
    let stat;

    try {
      stat = fs.statSync(path);
    } catch (error) {
      return this.error(`Could not access given path: ${chalk.dim(path)}`);
    }

    let additionalErrorInfo = '';

    try {
      if (stat.isDirectory()) {
        return this.parseDirectory(path);
      }
      if (stat.isFile()) {
        return this.parseFile(path);
      }
    } catch (error) {
      if (error.name === 'SyntaxError') {
        additionalErrorInfo = `JSON failed to compile with error: ${chalk.dim(error.message)}.`;
      }
    }

    return this.error(`Could not parse the given path: ${chalk.dim(path)}. ${additionalErrorInfo}`);
  }

  parseDirectory(directory) {
    const files = fs.readdirSync(directory);

    const result = {};

    for (const file of files) {
      // Ignore dotfiles
      if (file.startsWith('.') || !file.endsWith('.json')) {
        continue;
      }

      Object.entries(this.parsePath(directory + sep + file)).forEach(([key, value]) => {
        if (Object.hasOwnProperty.call(result, key)) {
          result[key].push(...value);
        } else {
          result[key] = value;
        }
      });
    }

    return result;
  }

  parseFile(file) {
    if (file.match(/package(-lock)?\.json$/)) {
      return {};
    }

    const contents = JSON.parse(fs.readFileSync(file));

    if (Array.isArray(contents)) {
      const lastSeperator = file.lastIndexOf(sep);
      const endpoint = file.substring(lastSeperator > 0 ? lastSeperator + 1 : 0, file.length - 5);
      return {
        [endpoint]: contents,
      };
    }

    return contents;
  }

  post(endpoint, payload) {
    const url = process.env.CHEC_API_URL || 'api.chec.io';
    const key = process.env.CHEC_SECRET_KEY;

    if (!url || !key) {
      return this.error(`Required .env keys "${chalk.bold('CHEC_API_URL')}" and/or ${chalk.bold('CHEC_SECRET_KEY')} are missing`);
    }

    const headers = {
      'content-type': 'application/json',
      'x-authorization': key,
    };

    return got(`${url}/${endpoint}`, {
      method: 'post',
      body: JSON.stringify(payload),
      headers,
      retry: {
        retries: 0,
      },
    });
  }

  error(log) {
    if (this.showSpinner) {
      this.spinner.stop();
    }
    throw new Error(log)
  }
}

module.exports = {
  seed(path, logHandler = () => {}, spinner = false) {
    return new Seeder(logHandler, spinner).run(path);
  },
  Seeder,
}
