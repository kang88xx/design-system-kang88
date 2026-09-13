// Redirect read-only public navigation data to its local capture.
const nativeFetch=window.fetch.bind(window);
window.fetch=(input,init)=>{
  const url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,location.href);
  if(url.pathname.endsWith('/global-header/v1/flyouts'))return nativeFetch('/apple_design/app/dist/client/api-www/global-elements/global-header/v1/flyouts.json',init);
  if(url.pathname.includes('/suggestions/defaultlinks/'))return nativeFetch('/apple_design/app/dist/client/search-services/suggestions/defaultlinks/index.json',init);
  if(url.pathname.includes('/us/shop/bag/status'))return Promise.resolve(new Response(JSON.stringify({items:0,count:0}),{headers:{'Content-Type':'application/json'}}));
  return nativeFetch(input,init);
};
