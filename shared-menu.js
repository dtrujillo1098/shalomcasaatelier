(function(){
  const item=document.querySelector('.pill-item');if(!item)return;
  const button=item.querySelector('.pill-parent');
  const set=open=>{item.classList.toggle('is-open',open);button.setAttribute('aria-expanded',String(open))};
  button.addEventListener('click',event=>{event.stopPropagation();set(!item.classList.contains('is-open'))});
  document.addEventListener('click',event=>{if(!item.contains(event.target))set(false)});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')set(false)});
  const page=location.pathname.split('/').pop();
  document.querySelectorAll('.pill-nav a').forEach(link=>{if(link.getAttribute('href').split('?')[0]==='./'+page){link.setAttribute('aria-current','page');link.classList.add('is-current')}});
})();