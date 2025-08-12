
/* ===============================
   Utilities & Elements
   =============================== */
const form = document.getElementById('contactForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const messageInput = document.getElementById('message');

const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const messageError = document.getElementById('messageError');

const charCount = document.getElementById('charCount');
const livePreview = document.getElementById('livePreview');
const progressBar = document.getElementById('progressBar');

const submitBtn = document.getElementById('submitBtn');
const btnLoader = document.getElementById('btnLoader');

const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');

const saveDraft = document.getElementById('saveDraft');
const clearDraft = document.getElementById('clearDraft');
const themeToggle = document.getElementById('themeToggle');

const topBtn = document.getElementById('topBtn');

let lastMessage = '';
let lastSubmitTime = 0;

/* ===============================
   Email regex & helpers
   =============================== */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setValid(el){
  el.classList.remove('invalid'); el.classList.add('valid');
}
function setInvalid(el){
  el.classList.remove('valid'); el.classList.add('invalid');
}
function clearState(el){
  el.classList.remove('valid','invalid');
}

/* ===============================
   Validation functions
   =============================== */
function validateName(){
  const v = nameInput.value.trim();
  if(v === ''){
    nameError.textContent = 'Name is required.';
    setInvalid(nameInput); return false;
  }
  if(v.length < 2){
    nameError.textContent = 'Use at least 2 characters.';
    setInvalid(nameInput); return false;
  }
  nameError.textContent = '';
  setValid(nameInput); return true;
}

function validateEmail(){
  const v = emailInput.value.trim();
  if(v === ''){
    emailError.textContent = 'Email is required.';
    setInvalid(emailInput); return false;
  }
  if(!emailRegex.test(v)){
    emailError.textContent = 'Enter a valid email address.';
    setInvalid(emailInput); return false;
  }
  emailError.textContent = '';
  setValid(emailInput); return true;
}

function validateMessage(){
  const v = messageInput.value.trim();
  if(v === ''){
    messageError.textContent = 'Message is required.';
    setInvalid(messageInput); return false;
  }
  if(v.length < 6){
    messageError.textContent = 'Message is too short.';
    setInvalid(messageInput); return false;
  }
  messageError.textContent = '';
  setValid(messageInput); return true;
}

/* ===============================
   Live UI updates
   =============================== */
function updateCharCount(){
  const left = 250 - messageInput.value.length;
  charCount.textContent = `${left} chars left`;
}
function updatePreview(){
  const n = nameInput.value.trim() || '—';
  const e = emailInput.value.trim() || '—';
  const m = messageInput.value.trim() || '(empty)';
  livePreview.innerHTML = `<strong>${escapeHtml(n)}</strong> <span style="color:var(--muted)">(${escapeHtml(e)})</span><hr style="opacity:.06;margin:8px 0"/>${escapeHtml(m).replace(/\n/g,'<br/>')}`;
}
function escapeHtml(s){
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

/* progress percent (simple weighting) */
function updateProgress(){
  let score = 0;
  if(nameInput.value.trim().length > 0) score += 30;
  if(emailInput.value.trim().length > 0) score += 30;
  score += Math.min(40, Math.floor((messageInput.value.trim().length/250)*40));
  progressBar.style.width = score + '%';
}

/* ===============================
   LocalStorage draft
   =============================== */
const DKEY = 'contact_form_draft_v1';
function saveDraftToLocal(){
  const payload = {
    name:nameInput.value,
    email:emailInput.value,
    message:messageInput.value,
    ts: Date.now()
  };
  localStorage.setItem(DKEY, JSON.stringify(payload));
  saveDraft.textContent = 'Saved ✓';
  setTimeout(()=> saveDraft.textContent = 'Save Draft', 1200);
}
function clearDraftFromLocal(){
  localStorage.removeItem(DKEY);
  clearDraft.textContent = 'Cleared ✓';
  setTimeout(()=> clearDraft.textContent = 'Clear Draft', 1200);
  nameInput.value=''; emailInput.value=''; messageInput.value='';
  updateAll();
}
function restoreDraft(){
  const raw = localStorage.getItem(DKEY);
  if(!raw) return;
  try{
    const p = JSON.parse(raw);
    nameInput.value = p.name || '';
    emailInput.value = p.email || '';
    messageInput.value = p.message || '';
  }catch(e){}
  updateAll();
}

/* ===============================
   Auto-focus behaviours
   =============================== */
/* move to next field when maxlength reached on name/email/message */
[nameInput,emailInput,messageInput].forEach(el=>{
  el.addEventListener('input', (e)=>{
    // if cursor at end and reached maxlength, focus next
    if(el.maxLength && el.value.length >= el.maxLength){
      const formEls = [nameInput, emailInput, messageInput];
      const idx = formEls.indexOf(el);
      if(idx >=0 && idx < formEls.length-1) formEls[idx+1].focus();
    }
  });
});
/* also move to next on Enter key for name/email */
nameInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); emailInput.focus(); }});
emailInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); messageInput.focus(); }});

/* ===============================
   Event listeners for live feedback
   =============================== */
[nameInput, emailInput].forEach(i => {
  i.addEventListener('input', ()=>{ validateName(); validateEmail(); updateAll(); });
});
messageInput.addEventListener('input', ()=>{ validateMessage(); updateAll(); });

function updateAll(){
  updateCharCount(); updatePreview(); updateProgress();
  // clear state if empty
  if(!nameInput.value) clearState(nameInput);
  if(!emailInput.value) clearState(emailInput);
  if(!messageInput.value) clearState(messageInput);
}

/* ===============================
   Form submit handling (demo)
   =============================== */
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const nOk = validateName();
  const eOk = validateEmail();
  const mOk = validateMessage();

  if(!(nOk && eOk && mOk)){
    // focus first invalid
    if(!nOk) nameInput.focus();
    else if(!eOk) emailInput.focus();
    else if(!mOk) messageInput.focus();
    return;
  }

  // Prevent repeated exact message within 10s (simple spam guard)
  const now = Date.now();
  if(messageInput.value.trim() === lastMessage && (now - lastSubmitTime) < 10000){
    alert('Please avoid sending the same message repeatedly so quickly.');
    return;
  }

  // simulate submit loading
  submitBtn.classList.add('loading'); btnLoader.style.display='block';
  submitBtn.disabled = true;

  // small delay to show loader
  setTimeout(()=>{
    submitBtn.classList.remove('loading'); btnLoader.style.display='none';
    submitBtn.disabled = false;

    // show modal success
    document.getElementById('modalMsg').textContent = `Hi ${nameInput.value.trim() || 'there'} — your message is validated. (Demo: not actually sent.)`;
    showModal();

    // store last message/time
    lastMessage = messageInput.value.trim();
    lastSubmitTime = Date.now();

    // clear form but keep draft saved optionally
    form.reset(); updateAll();
    clearState(nameInput); clearState(emailInput); clearState(messageInput);

  }, 1400);
});

/* ===============================
   Modal show/hide
   =============================== */
function showModal(){
  modalBackdrop.style.display = 'flex';
  modalBackdrop.setAttribute('aria-hidden','false');
}
function hideModal(){
  modalBackdrop.style.display = 'none';
  modalBackdrop.setAttribute('aria-hidden','true');
}
modalClose.addEventListener('click', hideModal);
modalBackdrop.addEventListener('click', (e)=>{ if(e.target === modalBackdrop) hideModal(); });

/* ===============================
   Save / clear draft buttons
   =============================== */
saveDraft.addEventListener('click', saveDraftToLocal);
clearDraft.addEventListener('click', clearDraftFromLocal);

/* restore on load */
window.addEventListener('load', ()=>{
  restoreDraft();
  updateAll();
  // show top button logic
  window.addEventListener('scroll', handleScroll);
});

/* ===============================
   Theme toggle
   =============================== */
themeToggle.addEventListener('click', ()=>{
  const root = document.body;
  const t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', t);
});

/* ===============================
   Back to top
   =============================== */
function handleScroll(){
  if(window.scrollY > 240) topBtn.style.display = 'block'; else topBtn.style.display = 'none';
}
topBtn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));

/* ===============================
   Small accessibility: save draft on ctrl+s or ctrl+S
   =============================== */
window.addEventListener('keydown', (e)=>{
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){
    e.preventDefault(); saveDraftToLocal();
  }
});

/* ===============================
   Extra: auto-save every 8 seconds (only if changed)
   =============================== */
let lastAuto = '';
setInterval(()=>{
  const cur = JSON.stringify({n:nameInput.value,e:emailInput.value,m:messageInput.value});
  if(cur !== lastAuto){
    lastAuto = cur;
    localStorage.setItem(DKEY, JSON.stringify({name:nameInput.value, email: emailInput.value, message: messageInput.value, ts:Date.now()}));
    // subtle transient indicator could be added
  }
}, 8000);

/* ===============================
   Initial small validation triggers
   =============================== */
updateAll();
