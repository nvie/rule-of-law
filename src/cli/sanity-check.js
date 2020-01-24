// @flow

const commander = require('commander')
// const parser = require('./parser')

type Options = {|
  verbose: boolean,
|}

function runWithOptions(options: Options) {
  console.log('// TODO: Parse rules here')
}

async function main() {
  const program = commander
    .name('sanity-check')
    .version('0.0.1')
    .usage('[options] <path> [<path> ...]')
    .description('TODO')
    .option('-v, --verbose', 'Be verbose')
    .parse(process.argv)

  // $FlowFixMe - options monkey-patched on program are invisible to Flow
  if (program.args.length < 1) {
    program.help()
  } else {
    // $FlowFixMe - options monkey-patched on program are invisible to Flow
    const { verbose } = program
    const options = { verbose }
    runWithOptions(options)
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => console.error(e) || process.exit(1))
