import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
    {
        ignores: [
            'dist/**',
            'public/**',
            'tools/**',
            'tasks/**',
            'node_modules/**',
            // 旧 Explore/Analyze 画面は現行主画面の対象外。旧コードは変更しない。
            'src/components/map/**',
        ],
    },
    ...typescriptEslint.configs['flat/recommended'],
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            ...reactRefresh.configs.vite.rules,
            // npm run lint は warning を許容しないため、推奨ルールをエラーとして扱う。
            'react-hooks/exhaustive-deps': 'error',
        },
    },
    {
        files: [
            'src/components/potential/PanelViewSelector.tsx',
            'src/components/potential/prototypes/PrototypeViews.tsx',
        ],
        rules: {
            // 共有定数・型ガード・表示用関数も公開するため、コンポーネント専用 rule を適用しない。
            'react-refresh/only-export-components': 'off',
        },
    },
];
