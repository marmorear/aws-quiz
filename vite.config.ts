import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    base: '/aws-quiz/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        }
    }
});