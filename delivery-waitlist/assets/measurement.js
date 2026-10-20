/* Waitlist measurement is optional and separate from email-update consent. */
(() => {
  'use strict';
  const PIXEL='28937196299225819',GA='G-ZTN62C8F6N',KEY='stradenWaitlistMeasurementV1';
  const audience=document.body.dataset.segment==='projects'?'projects':'service';
  const box=document.querySelector('.sw-measurement');
  if(!box)return;
  let enabled=false,started=false,pageSent=false,pending=null;
  const sent=new Set();
  const read=(kind,key)=>{try{return window[kind].getItem(key);}catch{return null;}};
  const write=(kind,key,value)=>{try{window[kind].setItem(key,value);}catch{/* Session-only fallback. */}};
  const load=src=>{const script=document.createElement('script');script.async=true;script.src=src;document.head.appendChild(script);};
  const safeLocation=()=>{
    const query=new URLSearchParams();
    const params=new URLSearchParams(location.search);
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','campaign_id','adset_id','ad_id'].forEach(key=>{const value=params.get(key);if(value)query.set(key,value.slice(0,300));});
    return location.origin+location.pathname+(query.size?'?'+query.toString():'');
  };
  function start(){
    enabled=true;window['ga-disable-'+GA]=false;
    if(!started){
      started=true;
      window.dataLayer=window.dataLayer||[];
      window.gtag=function(){window.dataLayer.push(arguments);};
      window.gtag('js',new Date());
      window.gtag('config',GA,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
      load('https://www.googletagmanager.com/gtag/js?id='+GA);
      const fbq=window.fbq=function(){fbq.callMethod?fbq.callMethod.apply(fbq,arguments):fbq.queue.push(arguments);};
      if(!window._fbq)window._fbq=fbq;
      fbq.push=fbq;fbq.loaded=true;fbq.version='2.0';fbq.queue=[];
      fbq('set','autoConfig',false,PIXEL);
      fbq('init',PIXEL);
      load('https://connect.facebook.net/en_US/fbevents.js');
    }
    window.fbq('consent','grant');
    window.gtag('consent','update',{analytics_storage:'granted',ad_storage:'granted'});
    if(!pageSent){
      pageSent=true;
      window.gtag('event','page_view',{page_location:safeLocation(),page_title:document.title,audience});
      window.fbq('track','PageView',{content_category:audience,content_name:'Straden delivery waitlist'});
    }
    if(pending)confirmed(pending);
  }
  function stop(){
    enabled=false;pending=null;window['ga-disable-'+GA]=true;
    if(window.fbq)window.fbq('consent','revoke');
    if(window.gtag)window.gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied'});
  }
  function choose(choice){
    write('localStorage',KEY,choice);box.hidden=true;
    if(choice==='granted')start();else stop();
    document.dispatchEvent(new CustomEvent('straden:measurement-choice'));
  }
  function confirmed(result){
    if(result?.saved!==true||result.conversion_eligible!==true||typeof result.conversion_id!=='string'||!/^[0-9a-f-]{36}$/i.test(result.conversion_id))return false;
    if(!enabled){if(read('localStorage',KEY)!=='denied')pending=result;return false;}
    const id='waitlist:'+result.conversion_id;
    if(sent.has(id)||read('sessionStorage',id)==='sent')return false;
    sent.add(id);write('sessionStorage',id,'sent');pending=null;
    // The envelope is deliberately independent of form inputs and revenue.
    const params={content_name:'Straden '+audience+' waitlist',content_category:audience,lead_type:'delivery_waitlist'};
    window.fbq('track','Lead',params,{eventID:id});
    window.gtag('event','generate_lead',{audience,lead_type:'delivery_waitlist',page_location:safeLocation()});
    return true; // Queued in the browser; a Meta receipt is verified separately.
  }
  box.querySelector('[data-measurement-accept]').addEventListener('click',()=>choose('granted'));
  box.querySelector('[data-measurement-decline]').addEventListener('click',()=>choose('denied'));
  document.querySelectorAll('[data-measurement-choices]').forEach(button=>button.addEventListener('click',()=>{box.hidden=false;box.querySelector('[data-measurement-decline]').focus();}));
  window.addEventListener('storage',event=>{if(event.key===KEY&&event.newValue!=='granted')stop();});
  window.StradenWaitlistMeasurement={confirmed,accepted:()=>enabled,withdraw:()=>choose('denied')};
  const choice=read('localStorage',KEY);
  if(choice==='granted'){box.hidden=true;start();}else box.hidden=choice==='denied';
})();
