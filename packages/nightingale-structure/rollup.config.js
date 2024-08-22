import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'esm',
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    replace({
        'process.env.NODE_ENV': JSON.stringify('production'), // or 'development'
        preventAssignment: true,
      }),
  ]
};