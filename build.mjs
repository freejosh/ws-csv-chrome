import fs from 'fs';
import * as esbuild from 'esbuild';
import { clean } from 'esbuild-plugin-clean';
import { copy } from 'esbuild-plugin-copy';
import { environmentPlugin as env } from 'esbuild-plugin-environment';
import write from 'esbuild-plugin-write-file';

const pkg = JSON.parse(fs.readFileSync('./package.json'));

const BUILD_DIR = './build';
const MAIN_FILE = 'main.js';
const BACKGROUND_FILE = 'background.js';

(async () => {
  await esbuild.build({
    entryPoints: [`./src/${BACKGROUND_FILE}`, `./src/${MAIN_FILE}`],
    bundle: true,
    sourcemap: true,
    outdir: BUILD_DIR,
    minify: true,
    plugins: [
      clean({
        patterns: [`${BUILD_DIR}/*`],
      }),
      copy({
        resolveFrom: 'cwd',
        assets: {
          from: ['./static/*'],
          to: [BUILD_DIR],
        },
      }),
      env({
        MAIN_FILE,
      }),
      write({
        after: {
          [`${BUILD_DIR}/manifest.json`]: JSON.stringify({
            manifest_version: 3,
            name: 'Wealthsimple CSV',
            description: '',
            version: pkg.version,
            background: {
              service_worker: BACKGROUND_FILE,
            },
            action: {
              default_title: 'Wealthsimple CSV',
            },
            permissions: ['scripting', 'activeTab'],
          }),
        },
      }),
    ],
  });
})();
