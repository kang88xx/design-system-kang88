(() => {
  const init=()=>window.OpalBlogCTA?.mount('#requested-blog-cta',{href:'/blog',label:'View All Blogs',preview:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
