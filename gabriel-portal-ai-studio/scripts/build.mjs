import {resolve} from 'node:path';
import {build as viteBuild} from 'vite';
import react from '@vitejs/plugin-react';
import {build as esbuild} from 'esbuild';
import {sync} from './sync-shared.mjs';
const root=resolve(import.meta.dirname,'..');process.chdir(root);await sync();
await viteBuild({configFile:false,root,resolve:{alias:{'@':resolve(root,'shared')}},plugins:[react()],build:{outDir:'dist/client',emptyOutDir:true}});
await esbuild({entryPoints:[resolve(root,'server/main.ts')],outfile:resolve(root,'dist/server.mjs'),bundle:true,platform:'node',target:'node22',format:'esm',packages:'external',alias:{'@/lib/server':resolve(root,'server/domain.ts'),'@/app/chatgpt-auth':resolve(root,'server/auth.ts'),'@':resolve(root,'shared'),'cloudflare:workers':resolve(root,'server/runtime.ts')}});
console.log('Independent portal build complete.');
