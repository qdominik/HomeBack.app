// Local review harness: native controls rendered from production components.
// No API, storage, uploads, account data or mutations outside this page.
for(const button of document.querySelectorAll('[data-tone-choice]')){
  button.addEventListener('click',()=>{
    const tone=button.dataset.toneChoice;
    document.documentElement.dataset.theme=tone==='dark'?'dark':'light';
    if(tone==='cool')document.documentElement.dataset.tone='cool';else delete document.documentElement.dataset.tone;
    for(const other of document.querySelectorAll('[data-tone-choice]'))other.setAttribute('aria-pressed',String(other===button));
  });
}
for(const button of document.querySelectorAll('[data-open]'))button.addEventListener('click',()=>document.getElementById(button.dataset.open).showModal());
for(const button of document.querySelectorAll('[data-close]'))button.addEventListener('click',()=>button.closest('dialog').close());
for(const form of document.querySelectorAll('form'))form.addEventListener('submit',event=>{
  event.preventDefault();
  const output=form.querySelector('[role="status"]');
  if(output)output.textContent='Podgląd formularza — nic nie zapisano.';
});
const name=document.getElementById('example-name');
const error=document.createElement('p');
error.id='example-name-error';error.className='text-sm text-danger';error.setAttribute('role','alert');error.hidden=true;name.parentElement.append(error);
document.getElementById('show-field-error').addEventListener('click',()=>{
  name.value='';name.setCustomValidity('Podaj nazwę rzeczy.');name.setAttribute('aria-invalid','true');name.setAttribute('aria-errormessage',error.id);name.setAttribute('aria-describedby',`example-name-help ${error.id}`);error.textContent='Podaj nazwę rzeczy.';error.hidden=false;name.focus();
});
name.addEventListener('input',()=>{
  if(!name.value.trim())return;
  name.setCustomValidity('');name.removeAttribute('aria-invalid');name.removeAttribute('aria-errormessage');name.setAttribute('aria-describedby','example-name-help');error.hidden=true;error.textContent='';
});
