const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

const buildConfig = {
  entryPoints: ['src/usal.js'],
  bundle: true,
  sourcemap: true,
  target: ['es2020'],
};

async function build() {
  console.log('🚀 Building USAL...\n');

  await esbuild.build({
    ...buildConfig,
    format: 'esm',
    outfile: 'dist/usal.esm.js',
  });
  console.log('✅ ESM build complete');

  await esbuild.build({
    ...buildConfig,
    format: 'cjs',
    outfile: 'dist/usal.cjs.js',
  });
  console.log('✅ CJS build complete');

  await esbuild.build({
    ...buildConfig,
    format: 'iife',
    globalName: 'USAL',
    outfile: 'dist/usal.umd.js',
  });
  console.log('✅ UMD build complete');

  await esbuild.build({
    ...buildConfig,
    format: 'iife',
    globalName: 'USAL',
    minify: true,
    outfile: 'dist/usal.umd.min.js',
  });
  console.log('✅ UMD minified build complete');

  const frameworks = [
    { name: 'react', entry: 'src/integrations/react.js', external: 'react' },
    { name: 'vue', entry: 'src/integrations/vue.js', external: 'vue' },
    { name: 'svelte', entry: 'src/integrations/svelte.js', external: 'svelte' },
    { name: 'solid', entry: 'src/integrations/solid.js', external: 'solid-js' },
  ];

  for (const framework of frameworks) {
    if (fs.existsSync(framework.entry)) {
      const buildOptions = {
        entryPoints: [framework.entry],
        external: [framework.external],
        bundle: true,
      };

      if (framework.name === 'react' || framework.name === 'solid') {
        buildOptions.loader = { '.js': 'jsx' };
        buildOptions.jsx = 'automatic';
      }

      await esbuild.build({
        ...buildOptions,
        format: 'esm',
        outfile: `dist/${framework.name}.esm.js`,
      });

      await esbuild.build({
        ...buildOptions,
        format: 'cjs',
        outfile: `dist/${framework.name}.cjs.js`,
      });

      console.log(`✅ ${framework.name} build complete`);
    }
  }

  const typeFiles = [
    'src/types/index.d.ts',
    'src/types/react.d.ts', 
    'src/types/vue.d.ts',
    'src/types/svelte.d.ts',
    'src/types/solid.d.ts'
  ];

  typeFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const fileName = path.basename(file);
      fs.copyFileSync(file, `dist/${fileName}`);
    }
  });

  console.log('\n🎉 All builds complete!');
  console.log('📦 Ready for publishing to NPM');
}

build().catch(console.error);