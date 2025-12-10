import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var _b;
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        server: {
            port: Number((_b = env.VITE_DEV_PORT) !== null && _b !== void 0 ? _b : 5173),
            host: '0.0.0.0',
        },
        build: {
            sourcemap: true,
        },
    };
});
