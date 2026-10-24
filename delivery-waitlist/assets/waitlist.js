(function () {
  'use strict';
  const dialog=document.getElementById('sl-waitlist-dialog');
  if(!dialog)return;
  const form=document.getElementById('sl-signup-form');
  const status=document.getElementById('sw-status');
  const success=document.getElementById('sw-success');
  const submit=form.querySelector('[type=submit]');
  const email=document.getElementById('sw-email');
  const bar=document.querySelector('.sw-scroll');
  const segment=document.body.dataset.segment==='projects'?'projects':'service';
  const consentText='Email me about this Straden product and early access. I can unsubscribe at any time.';
  let pending=false,saved=false,submissionId=null,lastPayload=null,opener=null,heroVisible=true,closeVisible=false,barDismissed=false;
  const attribution={};
  attribution.landing_path=location.pathname;
  const params=new URLSearchParams(location.search);
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','campaign_id','adset_id','ad_id'].forEach(key=>{const v=params.get(key);if(v)attribution[key]=v.slice(0,300);});
  // No email or other form data is stored before the complete, consented request.
  function refreshBar(){bar.hidden=barDismissed||heroVisible||closeVisible||dialog.open||saved;}
  bar.querySelector('.sw-dismiss').addEventListener('click',()=>{barDismissed=true;refreshBar();});
  function openWaitlist(trigger,prefill){
    opener=trigger;
    if(prefill && prefill!==email.value && saved){saved=false;success.hidden=true;form.hidden=false;form.reset();submissionId=null;document.getElementById('sl-signup-title').textContent='Keep your business moving.';document.getElementById('sl-signup-intro').textContent='Join the Straden waitlist. A few details help us understand the businesses we’re building for.';}
    if(prefill)email.value=prefill;
    if(!dialog.open)dialog.showModal();
    document.body.style.overflow='hidden';refreshBar();
    if(!saved)document.getElementById(prefill?'sw-name':'sw-email').focus();
  }
  function closeWaitlist(){dialog.close();}
  dialog.querySelector('.sw-close').addEventListener('click',closeWaitlist);
  dialog.querySelector('[data-close-waitlist]').addEventListener('click',closeWaitlist);
  dialog.addEventListener('close',()=>{document.body.style.overflow='';refreshBar();if(opener?.isConnected)opener.focus();});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeWaitlist();});
  document.querySelectorAll('[data-open-waitlist]').forEach(button=>button.addEventListener('click',()=>openWaitlist(button,'')));
  document.querySelectorAll('[data-email-capture]').forEach(capture=>capture.addEventListener('submit',event=>{
    event.preventDefault();const input=capture.querySelector('[name=email]');
    if(!capture.reportValidity())return;
    openWaitlist(capture.querySelector('button'),input.value.trim());
  }));
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target.classList.contains('sl-hero'))heroVisible=entry.isIntersecting;else closeVisible=entry.isIntersecting;}refreshBar();});
  observer.observe(document.querySelector('.sl-hero'));observer.observe(document.querySelector('.sl-close'));
  const fields=['name','email','phone','revenue','revenue_currency','consent'];
  function error(field,message){const input=form.elements.namedItem(field);input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','sw-'+field+'-error');document.getElementById('sw-'+field+'-error').textContent=message;return input;}
  fields.forEach(field=>{const input=form.elements.namedItem(field);input.addEventListener('input',()=>{input.removeAttribute('aria-invalid');document.getElementById('sw-'+field+'-error').textContent='';});});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(pending)return;
    fields.forEach(field=>{form.elements.namedItem(field).removeAttribute('aria-invalid');document.getElementById('sw-'+field+'-error').textContent='';});status.textContent='';
    const data=new FormData(form);const name=String(data.get('name')||'').trim();const mail=String(data.get('email')||'').trim();const phone=String(data.get('phone')||'').trim();const revenue=String(data.get('revenue')||'');const revenueCurrency=String(data.get('revenue_currency')||'');let first=null;
    if(!name)first=error('name','Enter your name.');
    if(!mail||!email.validity.valid){const input=error('email','Enter a valid business email.');first||=input;}
    if(phone && (!/^[+()\d\s.#xext-]+$/i.test(phone)||phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>18)){const input=error('phone','Enter a valid phone number or leave this optional field blank.');first||=input;}
    if(!revenue){const input=error('revenue','Select your annual revenue range.');first||=input;}
    if(!['CAD','USD'].includes(revenueCurrency)){const input=error('revenue_currency','Select CAD or USD.');first||=input;}
    if(!data.has('consent')){const input=error('consent','Confirm you want product and early-access emails.');first||=input;}
    if(first){status.textContent='Please check the highlighted fields.';first.focus();return;}
    const body={name,email:mail,phone,revenue,revenue_currency:revenueCurrency,segment,consent:true,consent_text:consentText,attribution,website:String(data.get('website')||'')};
    // Reuse the ID for an unchanged retry, including after an uncertain response.
    const serial=JSON.stringify(body);if(serial!==lastPayload){submissionId=crypto.randomUUID();lastPayload=serial;}body.submission_id=submissionId;
    pending=true;form.setAttribute('aria-busy','true');submit.disabled=true;submit.textContent='Joining…';status.textContent='Saving your place…';
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(document.body.dataset.waitlistEndpoint||'/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
      const result=await response.json();
      if(!response.ok||result.saved!==true)throw new Error(result.error==='rate_limited'?'Please wait a little before trying again.':'We couldn’t save your details. Please try again.');
      try{window.StradenWaitlistMeasurement?.confirmed(result);}catch{/* Measurement never blocks a saved signup. */}
      saved=true;form.hidden=true;success.hidden=false;document.getElementById('sl-signup-title').textContent='You’re on the Straden waitlist.';document.getElementById('sl-signup-intro').textContent=segment==='projects'?'For project-based specialty contractors and technical consultancies.':'For service-led specialty trades.';
      status.textContent='';dialog.querySelector('[data-close-waitlist]').focus();refreshBar();
    }catch(err){status.textContent=err.name==='AbortError'?'The request timed out. Please retry; we’ll avoid creating a duplicate.':err.message;}
    finally{clearTimeout(timeout);pending=false;form.removeAttribute('aria-busy');submit.disabled=false;submit.innerHTML='Get early access <span aria-hidden="true">↗</span>';}
  });
})();
