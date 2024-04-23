import * as esbuild from 'esbuild';
import { clean } from 'esbuild-plugin-clean';
import { copy } from 'esbuild-plugin-copy';

(async () => {
  await esbuild.build({
    entryPoints: ['./src/content-script.js'],
    bundle: true,
    sourcemap: true,
    outdir: './build',
    plugins: [
      clean({
        patterns: ['./build/*'],
      }),
      copy({
        resolveFrom: 'cwd',
        assets: {
          from: ['./static/*'],
          to: ['./build'],
        },
      }),
    ],
  });
})();
