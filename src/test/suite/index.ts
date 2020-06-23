import * as path from 'path';
import * as mocha from 'mocha';
import * as glob from 'glob';
import * as source from 'source-map-support';

export const run = async (): Promise<void> => {
  const runner = new mocha({
    ui: 'tdd',
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (runner as any).color(true);

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((c, e) => {
    glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }

      files.forEach((f) => runner.addFile(path.resolve(testsRoot, f)));

      source.install();

      try {
        runner.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (err) {
        console.error(err);
        e(err);
      }
    });
  });
};

export default run;
