
'use strict';
const $=id=>document.getElementById(id);
const state={screen:'questionScreen',name:'',question:'',method:'virtual',deck:[],selected:[],own:['','',''],busy:false};
const screenSteps={questionScreen:1,methodScreen:2,virtualScreen:2,ownScreen:2,loadingScreen:3,resultScreen:3,errorScreen:3};
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let shuffleTimer,loadingInterval,deckRevision=0,deckGroup,cardCatalog=[];
function showScreen(id){state.screen=id;document.querySelectorAll('.screen').forEach(e=>e.hidden=e.id!==id);document.querySelectorAll('[data-step]').forEach(e=>{const n=Number(e.dataset.step);e.classList.toggle('current',n===screenSteps[id]);e.classList.toggle('done',n<screenSteps[id]);if(n===screenSteps[id])e.setAttribute('aria-current','step');else e.removeAttribute('aria-current')});document.querySelectorAll('[data-question]').forEach(e=>e.textContent=state.question);window.scrollTo({top:0,behavior:'instant'});const heading=$(id).querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}}
function setMotion(enabled){document.body.classList.toggle('paused',!enabled);$('motionToggle').setAttribute('aria-pressed',String(enabled));$('motionToggle').lastElementChild.textContent=enabled?'Motion on':'Motion off'}
setMotion(!motionQuery.matches);motionQuery.addEventListener('change',e=>setMotion(!e.matches));$('motionToggle').addEventListener('click',()=>setMotion($('motionToggle').getAttribute('aria-pressed')!=='true'));
$('homeLink').addEventListener('click',e=>{e.preventDefault();if(!state.busy)showScreen('questionScreen')});document.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',()=>showScreen(button.dataset.back)));
$('question_form').addEventListener('input',()=>{$('characterCount').textContent=`${$('question_form').value.length} / 1000`;$('question_form').classList.remove('is-invalid');$('question_form').removeAttribute('aria-invalid');$('formError').hidden=true});
$('name_form').addEventListener('input',()=>{$('name_form').classList.remove('is-invalid');$('name_form').removeAttribute('aria-invalid');$('formError').hidden=true});
$('questionForm').addEventListener('submit',e=>{e.preventDefault();const name=$('name_form').value.trim(),question=$('question_form').value.trim();const invalid=!name?$('name_form'):!question?$('question_form'):null;if(invalid){invalid.classList.add('is-invalid');invalid.setAttribute('aria-invalid','true');$('formError').hidden=false;$('formError').textContent=!name?'Enter your name to start.':'Enter a question for your reading.';invalid.focus();return}state.name=name;state.question=question;showScreen('methodScreen')});
function renderSlots(){
  const labels=['First card','Second card','Third card'];
  const spread=$('selectedSpread');
  if(spread.children.length!==3){
    spread.replaceChildren(...labels.map(()=>{const slot=document.createElement('div');slot.className='selected-slot';return slot}));
  }
  labels.forEach((label,index)=>{
    const slot=spread.children[index],card=state.selected[index],key=card?card.img||card.name:'';
    if(slot.dataset.card===key)return;
    slot.dataset.card=key;
    slot.innerHTML=`<div class="slot-label">${label}</div>${card?`<div class="revealed-card">${cardArt(card)}</div><div class="slot-name">${escapeHTML(card.name)}</div>`:'<div class="slot-empty" aria-hidden="true">✧</div><div class="slot-name">·</div>'}`;
  });
  $('selectionCounter').textContent=`${state.selected.length} of 3 selected`;
  $('virtualRead').disabled=state.selected.length!==3;
}
function renderOwn(){const focusIndex=document.activeElement?.dataset?.ownIndex;$('ownFields').innerHTML=state.own.map((value,i)=>`<div class="own-field"><span class="field-number" aria-hidden="true">${i+1}</span><input class="form-control" data-own-index="${i}" id="ownCard${i}" maxlength="100" value="${escapeHTML(value)}" aria-label="Card ${i+1}" list="tarotCardNames" placeholder="${['e.g. The Star','e.g. The Sun, reversed','e.g. The Empress'][i]||'Card name'}" required>${state.own.length>1?`<button class="remove-card" type="button" data-remove="${i}" aria-label="Remove card ${i+1}">×</button>`:''}</div>`).join('');$('addCard').disabled=state.own.length>=12;if(focusIndex&&$('ownCard'+focusIndex))$('ownCard'+focusIndex).focus()}
$('ownMethod').addEventListener('click',()=>{state.method='own';showScreen('ownScreen');renderOwn()});$('ownFields').addEventListener('input',e=>{if(e.target.matches('[data-own-index]')){state.own[Number(e.target.dataset.ownIndex)]=e.target.value;e.target.classList.remove('is-invalid');e.target.removeAttribute('aria-invalid');$('ownError').hidden=true}});
$('ownFields').addEventListener('click',e=>{const button=e.target.closest('[data-remove]');if(!button)return;const index=Number(button.dataset.remove);state.own.splice(index,1);renderOwn();$('ownCard'+Math.min(index,state.own.length-1)).focus()});$('addCard').addEventListener('click',()=>{if(state.own.length>=12)return;state.own.push('');renderOwn();$('ownCard'+(state.own.length-1)).focus()});
$('ownForm').addEventListener('submit',e=>{e.preventDefault();const invalid=state.own.findIndex(value=>!value.trim());if(invalid!==-1){const input=$('ownCard'+invalid);input.classList.add('is-invalid');input.setAttribute('aria-invalid','true');input.focus();$('ownError').hidden=false;$('ownError').textContent='Fill in each card or remove the empty fields.';return}requestReading()});$('virtualRead').addEventListener('click',()=>{if(state.selected.length===3)requestReading()});
function getReadingCards(){return state.method==='virtual'?state.selected:state.own.map(value=>{const name=value.trim();const normalized=normalizeName(name);const match=cardCatalog.find(card=>normalized===normalizeName(card.name));return {...(match||{}),name};})}
async function requestReading(){if(state.busy)return;const selected=getReadingCards();if(!selected.length)return;state.busy=true;$('homeLink').setAttribute('aria-disabled','true');showScreen('loadingScreen');let index=0;const messages=['Connecting with your question…','Exploring your cards…','Bringing your reading together…','Preparing your reading…'];$('loadingText').textContent=messages[0];loadingInterval=setInterval(()=>{$('loadingText').textContent=messages[Math.min(++index,messages.length-1)]},2200);const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),60000);try{if(location.protocol==='file:')throw new Error('local-preview');const response=await fetch('/api/tarot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:state.name,question:state.question,cards:selected.map((c,i)=>`${i+1})${c.name}.`).join('')}),signal:controller.signal});if(!response.ok)throw new Error('api-unavailable');const result=await response.json();if(result.error||!Array.isArray(result.cards)||result.cards.length!==selected.length||result.cards.some(c=>!c||typeof c.meaning!=='string')||typeof result.resume!=='string')throw new Error('invalid-response');renderResult(result)}catch(error){showScreen('errorScreen');$('apiError').textContent=error.message==='local-preview'?'Open the app through its local server to get your reading.':error.name==='AbortError'?'Your reading took longer than expected. Try again; your question and cards are saved for this visit.':'We could not load your reading. Try again; your question and cards are still here.'}finally{clearTimeout(timeout);clearInterval(loadingInterval);state.busy=false;$('homeLink').removeAttribute('aria-disabled')}}
$('retryButton').addEventListener('click',requestReading);$('editCards').addEventListener('click',()=>showScreen(state.method==='virtual'?'virtualScreen':'ownScreen'));$('backToCards').addEventListener('click',()=>showScreen(state.method==='virtual'?'virtualScreen':'ownScreen'));
$('startAgain').addEventListener('click',()=>{clearTimeout(shuffleTimer);state.question='';state.selected=[];state.own=['','',''];$('question_form').value='';$('characterCount').textContent='0 / 1000';$('ownError').hidden=true;$('formError').hidden=true;document.querySelectorAll('.is-invalid').forEach(e=>{e.classList.remove('is-invalid');e.removeAttribute('aria-invalid')});showScreen('questionScreen');$('question_form').focus({preventScroll:true})});


function normalizeName(value){return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
function cardArt(card){
  if(!card.img)return '<div class="unknown-card" role="img" aria-label="Manually entered card">✧</div>';
  const img=document.createElement('img');
  img.src='/static/cards/'+encodeURIComponent(card.img);
  img.alt=card.name;img.className='tarot-image';img.decoding='async';
  return img.outerHTML;
}
function setCatalog(catalog){cardCatalog=catalog;$('tarotCardNames').replaceChildren(...catalog.map(card=>{const option=document.createElement('option');option.value=card.name;return option}));return catalog}
// The original cards.js owns shuffling and the unique three-index selection.
async function resetDeck(animate=true){
  const revision=++deckRevision;clearTimeout(shuffleTimer);
  state.selected=[];deckGroup?.setEnabled(false);deckGroup=undefined;
  renderSlots();$('deck').replaceChildren();$('deck').classList.remove('dealing');
  $('deckStatus').hidden=false;$('deckStatus').textContent='Preparing your deck…';
  $('shuffleButton').disabled=true;
  try{
    const catalog=setCatalog(await TarotCards.loadCatalog());
    if(revision!==deckRevision||state.screen!=='virtualScreen')return;
    deckGroup=TarotCards.createCardGroup($('deck'),[],{catalog});state.deck=deckGroup.deck;
    $('deckStatus').hidden=true;
    if(animate&&!motionQuery.matches&&!document.body.classList.contains('paused')){
      $('deck').classList.add('dealing');deckGroup.setEnabled(false);
      shuffleTimer=setTimeout(()=>{if(revision!==deckRevision)return;$('deck').classList.remove('dealing');deckGroup.setEnabled(true);$('shuffleButton').disabled=false},1100);
    }else{$('shuffleButton').disabled=false}
  }catch(error){
    if(revision!==deckRevision)return;
    $('deckStatus').hidden=false;$('deckStatus').textContent='Could not load the cards. Select Shuffle to try again.';
    $('shuffleButton').disabled=false;
  }
}
$('virtualMethod').addEventListener('click',()=>{state.method='virtual';showScreen('virtualScreen');resetDeck()});
$('shuffleButton').addEventListener('click',()=>resetDeck());
$('deck').addEventListener('cardselected',event=>{state.selected=event.detail.selectedCards;renderSlots()});
document.addEventListener('cards',event=>{if(event.detail.container!==$('deck'))return;state.selected=event.detail.selectedCards;$('virtualRead').focus({preventScroll:true})});
TarotCards.loadCatalog().then(setCatalog).catch(()=>{/* Selection screen offers an explicit retry; physical cards remain available. */});
function renderResult(result){
  const selected=getReadingCards();
  $('reading').innerHTML=selected.map((card,i)=>`<article class="result-entry"><div>${cardArt(card)}</div><div><small>CARD ${i+1}</small><h2>${escapeHTML(card.name)}</h2><p>${escapeHTML(result.cards[i].meaning)}</p></div></article>`).join('');
  $('summaryText').textContent=result.resume;showScreen('resultScreen');
}
