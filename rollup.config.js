import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/main.js',
  output: [
    {
      file: 'dist/custom-console.js',
      format: 'umd',
      name: 'CustomConsole',
      sourcemap: true,
    },
    {
      file: 'dist/custom-console.esm.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/custom-console.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/custom-console.min.js',
      format: 'umd',
      name: 'CustomConsole',
      sourcemap: true,
      plugins: [terser()],
    },
  ],
  plugins: [
    postcss({
      extract: true,
      minimize: true,
      sourceMap: true,
    }),
    resolve({
      browser: true,
    }),
    commonjs(),
  ],
};
