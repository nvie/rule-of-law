// @flow

const commander = require('commander');
const parser = require('../parser');
const check = require('../checker').default;

type Options = {|
  verbose: boolean,
|};

function runWithOptions(options: Options, args: Array<string>) {
  const [inputFile] = args;
  const ast = parser.parseFile(inputFile);
  const typedAst = check(ast);
  console.log(JSON.stringify(typedAst, null, 2));
}

async function main() {
  const program = commander
    .name('sanity-check')
    .version('0.0.1')
    .usage('[options] <path> [<path> ...]')
    .description('TODO')
    .option('-v, --verbose', 'Be verbose')
    .parse(process.argv);

  // $FlowFixMe - options monkey-patched on program are invisible to Flow
  if (program.args.length < 1) {
    program.help();
  } else {
    // $FlowFixMe - options monkey-patched on program are invisible to Flow
    const { verbose } = program;
    const options = { verbose };
    runWithOptions(options, program.args);
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => console.error(e) || process.exit(1));
