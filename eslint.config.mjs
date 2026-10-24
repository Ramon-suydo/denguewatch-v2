import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
export default ts.config(
 { ignores:['dist/**','node_modules/**','.artifacts/**','public/**','data/**'] },
 js.configs.recommended,
 ...ts.configs.recommended,
 { files:['**/*.{js,mjs,ts,tsx}'],plugins:{'react-hooks':hooks},languageOptions:{globals:{...globals.node,...globals.browser}},rules:{'@typescript-eslint/no-explicit-any':'off','@typescript-eslint/no-unused-vars':['warn',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}],'no-empty':['error',{allowEmptyCatch:true}],'no-useless-escape':'off','no-undef':'off'} },
);
