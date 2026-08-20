(function () {
  'use strict';
  var contacts = [{type:'wechat',label:'微信',value:'ZZT-2004-12'},{type:'qq',label:'QQ',value:'3237659951'}];
  function fallbackCopy(value) { var area=document.createElement('textarea'); area.value=value; area.readOnly=true; area.style.position='fixed'; area.style.opacity='0'; document.body.appendChild(area); area.select(); try{document.execCommand('copy');}catch(_){} area.remove(); }
  function copy(value,button) { var result; if(navigator.clipboard&&navigator.clipboard.writeText){result=navigator.clipboard.writeText(value).catch(function(){fallbackCopy(value);});}else{fallbackCopy(value);result=Promise.resolve();} result.then(function(){button.textContent='已复制';setTimeout(function(){button.textContent='复制';},1500);}); }
  function mount(slot,index) {
    var menu=document.createElement('div'); var panelId='dwContactPanel'+index; menu.className='dw-contact-menu';
    menu.innerHTML='<button type="button" class="dw-contact-trigger" aria-expanded="false" aria-controls="'+panelId+'">联系我们</button><section class="dw-contact-panel" id="'+panelId+'" aria-label="联系方式" hidden><button type="button" class="dw-contact-close" aria-label="关闭联系面板">X</button>'+contacts.map(function(item,itemIndex){return '<div class="dw-contact-row '+item.type+'"><div><span class="dw-contact-label">'+item.label+'</span><b class="dw-contact-value">'+item.value+'</b></div><button type="button" class="dw-contact-copy" data-contact-index="'+itemIndex+'">复制</button></div>';}).join('')+'</section>';
    slot.appendChild(menu); var trigger=menu.querySelector('.dw-contact-trigger'); var panel=menu.querySelector('.dw-contact-panel');
    trigger.addEventListener('click',function(){panel.hidden=false;trigger.setAttribute('aria-expanded','true');});
    menu.querySelector('.dw-contact-close').addEventListener('click',function(){panel.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();});
    menu.addEventListener('click',function(event){var button=event.target.closest('[data-contact-index]');if(button)copy(contacts[Number(button.dataset.contactIndex)].value,button);});
  }
  function init(){document.querySelectorAll('[data-contact-menu]').forEach(mount);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
