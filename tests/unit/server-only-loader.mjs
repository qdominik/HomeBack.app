// Plain Node tests need the same server-only marker alias used by Next's server build.
// The application's server-only import remains intact for client-boundary checks.
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,nextResolve){
 if(specifier==='server-only')return {url:new URL('../../node_modules/next/dist/compiled/server-only/empty.js',import.meta.url).href,shortCircuit:true};
 return nextResolve(specifier,context);
}});
