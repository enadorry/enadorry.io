import app from './server/index.js';
export default { async fetch(request, env, ctx) {
 const headers = new Headers(request.headers);
 for (const name of [...headers.keys()]) if(name.startsWith('oai-')) headers.delete(name);
 if(new URL(request.url).pathname.startsWith('/api/')) return app.fetch(new Request(request,{headers}),env,ctx);
 return env.ASSETS.fetch(request);
}};
