/* ── Firebase 초기화 ── */
const firebaseConfig = {
  apiKey: "AIzaSyB6x7uhmAmt2PrUl1SH5I_jP8i0hP35c9A",
  authDomain: "daesang-contract.firebaseapp.com",
  databaseURL: "https://daesang-contract-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "daesang-contract",
  storageBucket: "daesang-contract.firebasestorage.app",
  messagingSenderId: "611998747428",
  appId: "1:611998747428:web:4b22853f4907859bba41b1"
};
let db = null;
let auth = null;
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.database();
  auth = firebase.auth();
} catch(e) {
  console.warn('Firebase 초기화 실패 (오프라인 모드):', e);
}

/* ── 상수 / 상태 ── */
const STORAGE_KEY = 'daesang_contracts';
let currentContract = null;

/* ── 로컬스토리지 ── */
function getContracts(){
  try { const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):[]; }
  catch(e){ return []; }
}
function saveContractsCache(l){
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(l)); } catch(e){}
}

/* ── 화면 전환 ── */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==='admin'){
    document.getElementById('adminLogin').style.display='flex';
    document.getElementById('adminDash').style.display='none';
  }
  if(id==='mypage'){
    document.getElementById('mypageLogin').style.display='block';
    document.getElementById('mypageDash').style.display='none';
  }
  window.scrollTo(0,0);
}

/* ── 서명 패드 ── */
let sigPoints=[],drawing=false,sigCtx,sigCanvas;
function initSigPad(){
  sigCanvas=document.getElementById('sigCanvas');
  const wrap=document.getElementById('sigWrap');
  sigCanvas.width=wrap.offsetWidth*window.devicePixelRatio;
  sigCanvas.height=160*window.devicePixelRatio;
  sigCtx=sigCanvas.getContext('2d');
  sigCtx.scale(window.devicePixelRatio,window.devicePixelRatio);
  sigCtx.strokeStyle='#0A1628';sigCtx.lineWidth=2.5;sigCtx.lineCap='round';sigCtx.lineJoin='round';
  function getPos(e){
    const r=sigCanvas.getBoundingClientRect();
    const src=e.touches?e.touches[0]:e;
    return{x:src.clientX-r.left,y:src.clientY-r.top};
  }
  function start(e){e.preventDefault();drawing=true;const p=getPos(e);sigPoints.push([p]);document.getElementById('sigHint').classList.add('hidden');}
  function move(e){e.preventDefault();if(!drawing)return;const p=getPos(e);sigPoints[sigPoints.length-1].push(p);redrawSig();}
  function end(e){e.preventDefault();drawing=false;}
  sigCanvas.addEventListener('mousedown',start);
  sigCanvas.addEventListener('mousemove',move);
  sigCanvas.addEventListener('mouseup',end);
  sigCanvas.addEventListener('touchstart',start,{passive:false});
  sigCanvas.addEventListener('touchmove',move,{passive:false});
  sigCanvas.addEventListener('touchend',end,{passive:false});
}
function redrawSig(){
  const w=sigCanvas.width/window.devicePixelRatio,h=sigCanvas.height/window.devicePixelRatio;
  sigCtx.clearRect(0,0,w,h);sigCtx.strokeStyle='#0A1628';sigCtx.lineWidth=2.5;
  for(const stroke of sigPoints){
    if(stroke.length<2)continue;
    sigCtx.beginPath();sigCtx.moveTo(stroke[0].x,stroke[0].y);
    for(let i=1;i<stroke.length;i++){
      const mx=(stroke[i-1].x+stroke[i].x)/2,my=(stroke[i-1].y+stroke[i].y)/2;
      sigCtx.quadraticCurveTo(stroke[i-1].x,stroke[i-1].y,mx,my);
    }
    sigCtx.stroke();
  }
}
function clearSig(){
  sigPoints=[];
  const w=sigCanvas.width/window.devicePixelRatio,h=sigCanvas.height/window.devicePixelRatio;
  sigCtx.clearRect(0,0,w,h);
  document.getElementById('sigHint').classList.remove('hidden');
}
function undoSig(){
  if(sigPoints.length>0)sigPoints.pop();
  redrawSig();
  if(sigPoints.length===0)document.getElementById('sigHint').classList.remove('hidden');
}
function hasSig(){return sigPoints.length>0;}
function getSigDataURL(){return sigCanvas.toDataURL('image/png');}

/* ── 약관 ── */
function toggleAllChecks(el){
  ['chk_terms','chk_privacy','chk_goods','chk_cms'].forEach(id=>document.getElementById(id).checked=el.checked);
}

/* ── 제출 ── */
async function submitContract(){
  const required=[['c_company','상호명'],['c_owner','대표자명'],['c_bizno','사업자번호'],['c_mobile','대표자 휴대폰'],['c_addr','사업장주소'],['c_bank','은행명'],['c_account','출금계좌번호'],['c_depositor','예금주명']];
  for(const[id,name]of required){if(!v(id)){showToast(`⚠️ ${name}을(를) 입력해 주세요`);return;}}
  if(!['chk_terms','chk_privacy','chk_goods','chk_cms'].every(id=>document.getElementById(id).checked)){showToast('⚠️ 필수 약관에 모두 동의해 주세요');return;}
  if(!hasSig()){showToast('⚠️ 서명을 해주세요');return;}
  showLoading('계약서 저장 중...');
  await sleep(800);
  const contract={
    id:'C'+Date.now(),
    signedAt:new Date().toISOString(),
    supplier:{name:'대상정보통신',bizno:'607-10-86981',ceo:'김진선',tel:'051-903-4561',addr:'부산시 남구 동명로 146번길 123'},
    customer:{company:v('c_company'),owner:v('c_owner'),bizno:v('c_bizno'),tel:v('c_tel'),mobile:v('c_mobile'),email:v('c_email'),addr:v('c_addr')},
    products:[
      {name:'POS',qty:v('qty_pos'),price:v('price_pos'),mgt:v('mgt_pos'),type:'임대'},
      {name:'키오스크',qty:v('qty_kiosk'),price:v('price_kiosk'),mgt:v('mgt_kiosk'),type:'임대'},
      {name:'테이블오더',qty:v('qty_table'),price:v('price_table'),mgt:v('mgt_table'),type:'임대'},
      {name:'QR오더',qty:v('qty_qr'),price:v('price_qr'),mgt:v('mgt_qr'),type:'임대'},
      {name:'카드단말기',qty:v('qty_card'),price:v('price_card'),mgt:v('mgt_card'),type:'임대'},
    ],
    conditions:{period:v('c_period'),payday:v('c_payday')},
    memo:v('c_memo'),
    cms:{bank:v('c_bank'),account:v('c_account'),depositor:v('c_depositor'),monthly:v('c_monthly')},
    signature:getSigDataURL()
  };
  try {
    if(typeof db !== 'undefined'){
      await db.ref('contracts/' + contract.id).set(contract);
    }
  } catch(e){ console.error('Firebase 저장 실패:', e); }
  const list=getContracts();list.unshift(contract);saveContractsCache(list);
  currentContract = contract;
  hideLoading();showScreen('success');
}
function v(id){return(document.getElementById(id)||{}).value||'';}

/* ── 관리자 로그인 ── */
async function checkLogin(){
  const email = document.getElementById('adminEmail').value.trim();
  const pw    = document.getElementById('adminPw').value;
  if(!email || !pw){ showToast('⚠️ 이메일과 비밀번호를 입력하세요'); return; }
  showLoading('로그인 중...');
  try {
    await auth.signInWithEmailAndPassword(email, pw);
    hideLoading();
    document.getElementById('adminLogin').style.display='none';
    document.getElementById('adminDash').style.display='block';
    window._fbListening = false;
    loadAdminData();
  } catch(e) {
    hideLoading();
    if(e.code==='auth/user-not-found'||e.code==='auth/wrong-password'||e.code==='auth/invalid-credential'){
      showToast('❌ 이메일 또는 비밀번호가 올바르지 않습니다');
    } else {
      showToast('❌ 로그인 실패: ' + e.message);
    }
  }
}

async function resetPassword(){
  const email = document.getElementById('adminEmail').value.trim();
  if(!email){ showToast('⚠️ 이메일을 먼저 입력해 주세요'); return; }
  showLoading('재설정 메일 발송 중...');
  try {
    await auth.sendPasswordResetEmail(email);
    hideLoading();
    showToast('✅ ' + email + ' 으로 재설정 링크를 보냈습니다');
  } catch(e) {
    hideLoading();
    showToast('❌ 발송 실패: ' + e.message);
  }
}

function adminLogout(){
  if(auth) auth.signOut();
  document.getElementById('adminLogin').style.display='flex';
  document.getElementById('adminDash').style.display='none';
  document.getElementById('adminEmail').value='';
  document.getElementById('adminPw').value='';
  window._fbListening = false;
  showToast('로그아웃 되었습니다');
}

/* ── 관리자 탭 ── */
function switchAdminTab(panelId,el){
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-panel').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}

/* ── 데이터 로드 ── */
function loadAdminData(){
  const now=new Date();
  document.getElementById('adminDate').textContent=now.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});
  showLoading('계약 목록 불러오는 중...');
  if(typeof db !== 'undefined'){
    db.ref('contracts').orderByChild('signedAt').once('value', snap => {
      hideLoading();
      const data = snap.val();
      const contracts = data ? Object.values(data).sort((a,b)=>new Date(b.signedAt)-new Date(a.signedAt)) : [];
      saveContractsCache(contracts);
      renderAdminStats(contracts);
    });
    if(!window._fbListening){
      window._fbListening = true;
      db.ref('contracts').on('value', snap => {
        const data = snap.val();
        const contracts = data ? Object.values(data).sort((a,b)=>new Date(b.signedAt)-new Date(a.signedAt)) : [];
        saveContractsCache(contracts);
        if(document.getElementById('adminDash').style.display !== 'none'){
          renderAdminStats(contracts);
        }
      });
    }
  } else {
    hideLoading();
    renderAdminStats(getContracts());
  }
}

function renderAdminStats(contracts){
  const now=new Date();
  document.getElementById('statTotal').textContent=contracts.length;
  document.getElementById('statToday').textContent=contracts.filter(c=>new Date(c.signedAt).toDateString()===now.toDateString()).length;
  const expiring=getExpiringThisMonth(contracts);
  document.getElementById('statExpire').textContent=expiring.length;
  renderContractList(contracts,'contractList',true);
  renderExpireList(expiring);
}

function getExpiringThisMonth(contracts){
  const now=new Date();
  return contracts.filter(c=>{
    const signed=new Date(c.signedAt);
    const period=parseInt(c.conditions?.period||36);
    const expDate=new Date(signed);
    expDate.setMonth(expDate.getMonth()+period);
    return expDate.getFullYear()===now.getFullYear()&&expDate.getMonth()===now.getMonth();
  });
}

function renderContractList(contracts,listId,showActions){
  const list=document.getElementById(listId);
  if(!contracts.length){list.innerHTML='<div class="empty-state"><div class="empty-icon">📋</div><p>조건에 맞는 계약서가 없습니다</p></div>';return;}
  list.innerHTML=contracts.map(c=>{
    const d=new Date(c.signedAt);
    const dateStr=d.toLocaleDateString('ko-KR')+' '+d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
    const period=parseInt(c.conditions?.period||36);
    const expDate=new Date(d);expDate.setMonth(expDate.getMonth()+period);
    const expStr=expDate.toLocaleDateString('ko-KR');
    return`<div class="contract-item" data-id="${c.id}" data-actions="${showActions}">
      <div class="contract-avatar">${c.customer.company.slice(0,2)}</div>
      <div class="contract-info">
        <div class="contract-name">${c.customer.company}</div>
        <div class="contract-meta">${c.customer.owner} · ${c.customer.mobile} · ${dateStr}</div>
        <div class="contract-meta" style="color:var(--gray5)">만기: ${expStr}</div>
      </div>
      <span class="contract-status status-done">서명완료</span>
      <span class="contract-arrow">›</span>
    </div>`;
  }).join('');
}

function renderExpireList(contracts){
  const list=document.getElementById('expireList');
  if(!contracts.length){list.innerHTML='<div class="empty-state"><div class="empty-icon">✅</div><p>이번 달 만기 가맹점이 없습니다</p></div>';return;}
  list.innerHTML=contracts.map(c=>{
    const d=new Date(c.signedAt);
    const period=parseInt(c.conditions?.period||36);
    const expDate=new Date(d);expDate.setMonth(expDate.getMonth()+period);
    const expStr=expDate.toLocaleDateString('ko-KR');
    return`<div class="contract-item expiring" data-id="${c.id}" data-actions="true">
      <div class="contract-avatar warn-av">⚠️</div>
      <div class="contract-info">
        <div class="contract-name">${c.customer.company}</div>
        <div class="contract-meta">${c.customer.owner} · ${c.customer.mobile}</div>
        <div class="contract-meta" style="color:#92400E;font-weight:600;">만기일: ${expStr}</div>
      </div>
      <span class="contract-status status-warn">만기임박</span>
      <span class="contract-arrow">›</span>
    </div>`;
  }).join('');
}

function applyFilter(){
  let contracts=getContracts();
  const from=document.getElementById('fDateFrom').value;
  const to=document.getElementById('fDateTo').value;
  const kw=document.getElementById('fKeyword').value.trim();
  if(from) contracts=contracts.filter(c=>new Date(c.signedAt)>=new Date(from));
  if(to)   contracts=contracts.filter(c=>new Date(c.signedAt)<=new Date(to+'T23:59:59'));
  if(kw)   contracts=contracts.filter(c=>c.customer.company.includes(kw)||c.customer.owner.includes(kw)||c.customer.mobile.includes(kw));
  renderContractList(contracts,'contractList',true);
  showToast(`🔍 ${contracts.length}건 조회됨`);
}

function exportExcel(){
  let contracts=getContracts();
  const from=document.getElementById('fDateFrom').value;
  const to=document.getElementById('fDateTo').value;
  const kw=document.getElementById('fKeyword').value.trim();
  if(from) contracts=contracts.filter(c=>new Date(c.signedAt)>=new Date(from));
  if(to)   contracts=contracts.filter(c=>new Date(c.signedAt)<=new Date(to+'T23:59:59'));
  if(kw)   contracts=contracts.filter(c=>c.customer.company.includes(kw)||c.customer.owner.includes(kw));
  const header=['계약번호','서명일시','상호명','대표자','사업자번호','휴대폰','이메일','주소','POS수량','키오스크수량','테이블오더수량','QR오더수량','카드단말기수량','의무사용기간(월)','만기일','월납입금액','은행','계좌번호','예금주','특이사항'];
  const rows=contracts.map(c=>{
    const d=new Date(c.signedAt);
    const period=parseInt(c.conditions?.period||36);
    const exp=new Date(d);exp.setMonth(exp.getMonth()+period);
    return[
      c.id,d.toLocaleDateString('ko-KR'),
      c.customer.company,c.customer.owner,c.customer.bizno,c.customer.mobile,c.customer.email||'',c.customer.addr,
      c.products[0]?.qty||'',c.products[1]?.qty||'',c.products[2]?.qty||'',c.products[3]?.qty||'',c.products[4]?.qty||'',
      c.conditions?.period||36,exp.toLocaleDateString('ko-KR'),
      c.cms?.monthly||'',c.cms?.bank||'',c.cms?.account||'',c.cms?.depositor||'',
      (c.memo||'').replace(/,/g,' ')
    ];
  });
  const csv='\uFEFF'+[header,...rows].map(r=>r.map(f=>`"${String(f).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`계약목록_${new Date().toLocaleDateString('ko-KR').replace(/\./g,'').replace(/ /g,'')}.csv`;
  a.click();showToast('📥 엑셀 파일이 다운로드됩니다');
}

/* ── 상세 모달 ── */
function openDetail(id,showActions){
  const contracts=getContracts();
  currentContract=contracts.find(c=>c.id===id);
  if(!currentContract) return;
  const c=currentContract;
  const d=new Date(c.signedAt);
  const dateStr=d.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const period=parseInt(c.conditions?.period||36);
  const exp=new Date(d);exp.setMonth(exp.getMonth()+period);
  document.getElementById('modalTitle').textContent=c.customer.company+' 계약서';
  const prods=c.products.filter(p=>p.qty&&p.qty!=='0').map(p=>`<tr><td>${p.name}</td><td>${p.qty}</td><td>${p.price?Number(p.price).toLocaleString()+'원':'-'}</td><td>${p.type}</td><td>${p.mgt?Number(p.mgt).toLocaleString()+'원':'-'}</td></tr>`).join('');
  document.getElementById('modalBody').innerHTML=`
    <div class="detail-section">
      <div class="detail-section-title">서명 일시</div>
      <div style="font-size:14px;font-weight:600;color:var(--accent)">${dateStr}</div>
      <div style="font-size:12px;color:var(--warn);margin-top:4px;">만기일: ${exp.toLocaleDateString('ko-KR')}</div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">고객 정보</div>
      <div class="detail-grid">
        <div class="detail-field"><label>상호명</label><span>${c.customer.company}</span></div>
        <div class="detail-field"><label>대표자</label><span>${c.customer.owner}</span></div>
        <div class="detail-field"><label>사업자번호</label><span>${c.customer.bizno}</span></div>
        <div class="detail-field"><label>휴대폰</label><span>${c.customer.mobile}</span></div>
        <div class="detail-field"><label>이메일</label><span>${c.customer.email||'-'}</span></div>
        <div class="detail-field" style="grid-column:1/-1"><label>주소</label><span>${c.customer.addr}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">제품 내역</div>
      <div style="overflow-x:auto"><table class="prod-table">
        <thead><tr><th>제품</th><th>수량</th><th>금액</th><th>형태</th><th>관리비</th></tr></thead>
        <tbody>${prods||'<tr><td colspan="5" style="color:var(--gray4)">-</td></tr>'}</tbody>
      </table></div>
      <div style="margin-top:8px;font-size:12px;color:var(--gray5)">의무사용기간: ${c.conditions?.period||36}개월 / 출금일: 매월 ${c.conditions?.payday||1}일</div>
      ${c.memo?`<div style="margin-top:8px;padding:10px;background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;font-size:12px;color:#92400E;"><b>📝 특이사항:</b><br>${c.memo}</div>`:''}
    </div>
    <div class="detail-section">
      <div class="detail-section-title">CMS 출금</div>
      <div class="detail-grid">
        <div class="detail-field"><label>은행</label><span>${c.cms?.bank||'-'}</span></div>
        <div class="detail-field"><label>계좌번호</label><span>${c.cms?.account||'-'}</span></div>
        <div class="detail-field"><label>예금주</label><span>${c.cms?.depositor||'-'}</span></div>
        <div class="detail-field"><label>월납입</label><span>${c.cms?.monthly||'-'}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">전자서명</div>
      <div class="sig-preview"><img src="${c.signature}" alt="서명"/></div>
    </div>`;

  const printBtn = document.getElementById('btn-modal-print');
  const emailBtn = document.getElementById('btn-modal-email');
  if(showActions){
    printBtn.textContent = '🖨️ 인쇄 / 출력';
    emailBtn.style.display = 'none';
  } else {
    printBtn.textContent = '🖨️ 계약서 인쇄';
    emailBtn.style.display = '';
  }
  document.getElementById('detailModal').classList.add('open');
}
function closeModal(){document.getElementById('detailModal').classList.remove('open');}

/* ── 고객 포털 ── */
function mypageLogin(){
  const bizno=document.getElementById('my_bizno').value.trim();
  const owner=document.getElementById('my_owner').value.trim();
  if(!bizno||!owner){showToast('⚠️ 사업자번호와 대표자 성함을 입력하세요');return;}
  function showMypageResult(contracts){
    if(!contracts.length){showToast('❌ 일치하는 계약서가 없습니다');hideLoading();return;}
    hideLoading();
    document.getElementById('mypageLogin').style.display='none';
    document.getElementById('mypageDash').style.display='block';
    document.getElementById('mypageTitle').textContent=contracts[0].customer.company+' 계약서';
    document.getElementById('mypageSub').textContent=`총 ${contracts.length}건의 계약서가 있습니다`;
    renderMypageList(contracts);
  }
  showLoading('계약서 조회 중...');
  if(typeof db !== 'undefined'){
    db.ref('contracts').orderByChild('signedAt').once('value', snap => {
      const data = snap.val();
      const all = data ? Object.values(data) : [];
      const contracts = all.filter(c=>
        c.customer.bizno.replace(/-/g,'')===bizno.replace(/-/g,'')&&
        c.customer.owner===owner
      );
      showMypageResult(contracts);
    });
  } else {
    const cached=getContracts().filter(c=>
      c.customer.bizno.replace(/-/g,'')===bizno.replace(/-/g,'')&&
      c.customer.owner===owner
    );
    showMypageResult(cached);
  }
}

function renderMypageList(contracts){
  const list=document.getElementById('mypageList');
  list.innerHTML=contracts.map(c=>{
    const d=new Date(c.signedAt);
    const period=parseInt(c.conditions?.period||36);
    const exp=new Date(d);exp.setMonth(exp.getMonth()+period);
    return`<div class="contract-item" data-id="${c.id}" data-actions="false">
      <div class="contract-avatar">${c.customer.company.slice(0,2)}</div>
      <div class="contract-info">
        <div class="contract-name">${c.customer.company}</div>
        <div class="contract-meta">계약일: ${d.toLocaleDateString('ko-KR')} · 만기: ${exp.toLocaleDateString('ko-KR')}</div>
        <div class="contract-meta">${c.products.filter(p=>p.qty&&p.qty!=='0').map(p=>p.name).join(', ')}</div>
      </div>
      <span class="contract-status status-done">보기 ›</span>
    </div>`;
  }).join('');
}

function mypageLogout(){
  document.getElementById('mypageLogin').style.display='block';
  document.getElementById('mypageDash').style.display='none';
  document.getElementById('my_bizno').value='';
  document.getElementById('my_owner').value='';
}

function sendEmail(){
  if(!currentContract)return;
  const c=currentContract;
  const email=c.customer.email;
  if(!email){showToast('⚠️ 등록된 이메일이 없습니다. 계약서에 이메일을 추가해주세요.');return;}
  const subject=encodeURIComponent(`[대상정보통신] ${c.customer.company} 계약서 사본`);
  const body=encodeURIComponent(`안녕하세요, ${c.customer.owner} 대표님\n\n대상정보통신 전자서명 계약서 사본을 첨부하여 드립니다.\n\n계약일: ${new Date(c.signedAt).toLocaleDateString('ko-KR')}\n계약번호: ${c.id}\n\n문의: 051-903-4561\n\n감사합니다.`);
  window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  showToast('📧 이메일 앱이 열립니다');
}

/* ── 인쇄 ── */
function buildContractHTML(c){
  const d=new Date(c.signedAt);
  const yy=d.getFullYear(),mm=d.getMonth()+1,dd=d.getDate();
  return`<div class="pc">
  <div class="pc-title-wrap"><div class="pc-title">카드단말기 · POS · 키오스크 · 테이블오더 · QR오더&nbsp;&nbsp;판매 할부 무상 임대 유지보수 및 서비스 계약서</div></div>
  <div class="pc-van"><span>VAN 구분 : 나이스정보통신</span><span>계약번호 : ${c.id}</span><span>서명일시 : ${yy}년 ${mm}월 ${dd}일</span></div>
  <table style="margin-bottom:4px;">
    <tr>
      <td rowspan="4" class="thl" style="width:22px;writing-mode:vertical-lr;letter-spacing:4px;">갑</td>
      <td class="label" style="width:68px;">사업자등록번호</td><td class="val" style="width:120px;">${c.supplier.bizno}</td>
      <td class="label" style="width:40px;">대표자</td><td class="val" style="width:80px;">${c.supplier.ceo}</td>
      <td style="width:8px;border:none;"></td>
      <td rowspan="4" class="thl" style="width:22px;writing-mode:vertical-lr;letter-spacing:4px;">&quot;을&quot; 고객 정보</td>
      <td class="label" style="width:68px;">사업자등록번호</td><td class="val" style="width:110px;">${c.customer.bizno}</td>
      <td class="label" style="width:52px;">사업장전화</td><td class="val">${c.customer.tel||''}</td>
    </tr>
    <tr><td class="label">상&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;호</td><td class="val">${c.supplier.name}</td><td class="label">전화번호</td><td class="val">${c.supplier.tel}</td><td style="border:none;"></td>
      <td class="label">상&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;호</td><td class="val">${c.customer.company}</td><td class="label">대표자 휴대폰</td><td class="val">${c.customer.mobile}</td></tr>
    <tr><td class="label">사 업 장 주 소</td><td colspan="3" class="val">${c.supplier.addr}</td><td style="border:none;"></td>
      <td class="label">대 표 자 명</td><td class="val">${c.customer.owner}</td><td class="label">계약내용</td><td class="val center">☑ 임대</td></tr>
    <tr><td class="label"></td><td colspan="3" class="val"></td><td style="border:none;"></td>
      <td class="label">사업장주소</td><td colspan="3" class="val">${c.customer.addr}</td></tr>
  </table>
  <div class="section-title" style="margin-bottom:0;">◎ 제품 공급 및 지원 내용(표2)</div>
  <table style="margin-bottom:4px;">
    <thead><tr>
      <th class="thl" style="width:16%;">제 품 명</th><th class="thl" style="width:9%;">약정건수</th>
      <th class="thl" style="width:7%;">수량</th><th class="thl" style="width:13%;">금&nbsp;액(원)</th>
      <th class="thl" style="width:9%;">제공형태</th><th class="thl" style="width:14%;">관리비/ASP</th>
      <th class="thl" style="width:12%;">임대물품</th><th class="thl" style="width:11%;">의무사용기간</th>
      <th class="thl" style="width:9%;">특이사항</th>
    </tr></thead>
    <tbody>
      ${c.products.map((p,i)=>`<tr>
        <td class="center">${p.name}</td><td class="center"></td><td class="center">${p.qty||''}</td>
        <td class="center">${p.price?Number(p.price).toLocaleString():''}</td>
        <td class="center">${p.type}</td>
        <td class="center">${p.mgt?Number(p.mgt).toLocaleString()+'원':''}</td>
        ${i===0?`<td class="center" rowspan="${c.products.length}">${c.products.filter(x=>x.qty).map(x=>x.name).join('·')}</td><td class="center" rowspan="${c.products.length}">${c.conditions?.period||36}개월</td><td class="small" rowspan="${c.products.length}" style="vertical-align:top;padding:4px;">${c.memo||''}</td>`:''}
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="section-title" style="margin-bottom:0;">◎ 주요공급 조건 및 특약사항(표3)</div>
  <table style="margin-bottom:4px;">
    <tr>
      <td class="label" style="width:70px;">관 리 비/ASP</td><td class="val" style="width:130px;">${c.products.find(p=>p.mgt)?Number(c.products.find(p=>p.mgt).mgt).toLocaleString()+'원(부가세 별도)':''}</td>
      <td class="label" style="width:60px;">임 대 물 품</td><td class="val" style="width:120px;">${c.products.filter(p=>p.qty&&p.type==='임대').map(p=>p.name).join(', ')}</td>
      <td class="label" style="width:70px;">의무사용기간</td><td class="val">${c.conditions?.period||36}개월</td>
      <td class="label" style="width:60px;">지정출금일</td><td class="val">매월 ${c.conditions?.payday||1}일</td>
    </tr>
    <tr><td class="label">비&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;고</td><td colspan="7" class="val small">CCTV설치시 AS목적으로 도메인을 귀사에서 보관함에 동의합니다. □&nbsp;&nbsp;"갑"은 업무상 필요시 "을"의 POS 원격을 자동연결하여 사용할 수 있음에 동의함 □&nbsp;&nbsp;"을"은 "갑"에게 카드사가맹점 관련된 서류신청 및 제신고, 단말기개통등 모든 업무를 위임합니다. □</td></tr>
  </table>
  <div class="section-title" style="margin-bottom:0;">◎【 CMS 출금이체신청 및 금융거래정보의 제공 동의서 】(표4)</div>
  <table style="margin-bottom:4px;">
    <tr><td class="label" style="width:70px;">은&nbsp;&nbsp;행&nbsp;&nbsp;명</td><td class="val" style="width:130px;">${c.cms?.bank||''}</td>
      <td class="label" style="width:70px;">출금 계좌 번호</td><td class="val" style="width:140px;">${c.cms?.account||''}</td>
      <td class="label" style="width:60px;">수납기관명</td><td class="val">${c.supplier.name}</td></tr>
    <tr><td class="label">예&nbsp;&nbsp;금&nbsp;&nbsp;주</td><td class="val">${c.cms?.depositor||''}</td>
      <td class="label">예금주 주민번호</td><td class="val"></td><td class="label">월 납입금액</td><td class="val">${c.cms?.monthly||''}</td></tr>
    <tr><td class="label">지정출금일자</td><td class="val">매 월 ${c.conditions?.payday||1}일</td>
      <td class="label">예&nbsp;&nbsp;금&nbsp;&nbsp;주</td><td colspan="3" class="val small">본 신청과 관련하여 본인은 금융거래정보(거래은행, 계좌번호)를 출금이체 신규 신청하는 때로부터 해지 신청할 때까지 상기수납기관에 제공하는 것에 동의하며, 출금이체 거래를 신청합니다. <span style="margin-left:16px;">서명: <span style="border-bottom:1px solid #000;padding:0 28px;">&nbsp;</span> (인)</span></td></tr>
  </table>
  <table style="margin-bottom:4px;"><tr>
    <td style="width:50%;vertical-align:top;border:none;padding:0 3px 0 0;">
      <div class="section-title">개인정보의 수집, 이용, 위탁 및 활용 동의서</div>
      <div class="pc-terms" style="border:.5px solid #999;padding:4px 6px;min-height:80px;">
        본인의 서비스 가입정보와 관련하여 귀사가 수집·이용 중인 본인의 개인정보는 「정보통신망이용촉진 및 정보보호등에 관한법률」에 따라 귀사가 수집·이용 및 취급 위탁 시 본인의 동의를 얻어야 하는 정보입니다.<br>
        <b>1. 수집·이용 목적:</b> 서비스 가입·변경·해지, A/S, 마케팅활용 등<br>
        <b>2. 수집항목:</b> 성명, 사업자등록번호, 연락처, 주소, 금융거래정보<br>
        <b>3. 보유기간:</b> 서비스 이용기간 및 관련법령에 따른 기간<br>
        ☑ 위의 사항에 동의합니다.
      </div>
    </td>
    <td style="width:50%;vertical-align:top;border:none;padding:0 0 0 3px;">
      <div class="section-title">물품반출동의서</div>
      <div class="pc-terms" style="border:.5px solid #999;padding:4px 6px;min-height:80px;">
        ① 물품내역: 표2 기재 제품 일체<br>
        ② 전항의 물품은 귀사(${c.supplier.name}) 소유물품으로서 본인이 이를 사업장에 정히 보관하고 있음을 확인하며, 다음 각 조항 중 하나의 사실이 발생할 경우 귀사의 해지통지 등 별도의 통지나 본인의 별도 동의 없이 보관물품을 귀사가 임의로 회수함에 동의합니다.<br>
        1. 가압류·가처분·압류·경매 2. 어음·수표 부도 3. 채무 이행 지체 4. 계약 위반<br>
        물품보관장소: ${c.customer.addr}
      </div>
    </td>
  </tr></table>
  <table style="margin-bottom:4px;">
    <tr>
      <td class="label center" style="width:18%;">고객(乙) 전자서명</td>
      <td class="center" style="width:32%;padding:2px;"><img src="${c.signature}" class="pc-sig-img"/></td>
      <td class="label center" style="width:18%;">담당자(甲) 서명</td>
      <td class="center" style="width:32%;height:60px;">&nbsp;</td>
    </tr>
    <tr>
      <td class="label center">서명일시</td>
      <td class="center small">${yy}년 ${mm}월 ${dd}일 ${d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</td>
      <td class="label center">처리일시</td>
      <td class="center small">&nbsp;&nbsp;&nbsp;&nbsp;년&nbsp;&nbsp;&nbsp;&nbsp;월&nbsp;&nbsp;&nbsp;&nbsp;일</td>
    </tr>
  </table>
  <div class="pc-footer">
    본인은 위 기재사항을 사실과 다름없이 기재하였고 &quot;갑&quot;의 영업자로부터 본 계약내용에 대하여 충분한 설명을 듣고 잘 이해하였으며 본 약정서의 사본을 확실히 수령하였으므로 본 약정내용을 성실히 이행할 것을 확약합니다.<br>
    <span style="margin-right:40px;">신청일자: ${yy}년 ${mm}월 ${dd}일</span>
    대표자 <span style="border-bottom:1px solid #000;padding:0 20px;"></span> (인) &nbsp;
    대리인 <span style="border-bottom:1px solid #000;padding:0 20px;"></span> (인)
  </div>
  <div style="page-break-before:always;"></div>
  <div class="section-title" style="text-align:center;font-size:10pt;margin-bottom:6px;">카드단말기·POS·키오스크·테이블오더·QR오더 서비스 이용 약관</div>
  <table><tr>
    <td style="width:50%;vertical-align:top;border:none;padding-right:6px;"><div class="pc-terms">
      <b>제1조 (서비스 이용 계약 성립)</b> 가맹점이 신청서를 작성하여 청약을 하고 회사가 승낙한 때 계약이 성립합니다.<br><br>
      <b>제2조 (서비스 이용)</b> 가맹점은 회사가 제공하는 제반 서비스를 이용하기 위해서 회사가 정한 표2의 카드단말기·POS·기타 거래조회서비스를 처리할 수 있는 통신프로그램이 탑재된 별도 부가장비를 가맹점에 설치하여야 합니다.<br><br>
      <b>제3조 (계약 조건, 기간)</b> 계약기간은 표3에 명시된 기간이며 계약기간 만료 1개월 전에 서면으로 계약해지 통보를 하여야 하며, 쌍방의 통보가 없을 경우 계약기간을 3년 단위로 자동연장 합니다. 가맹점은 매월 표4의 자동이체로 납부하여야 합니다.<br><br>
      <b>제4조 (기한이익의 상실)</b> ① 요금 3회 이상 연체 ② 약관 위반 ③ 사업 폐지·영업 정지 ④ 무상계약 약정건수 10% 이하 ⑤ 계약기간만료 전 사용 중지의 경우 잔여금액을 일괄 청구할 수 있습니다.<br><br>
      <b>제5조 (소유권)</b> 임대·무상·유지보수 계약 기기에 대한 소유권은 회사에 있습니다.<br><br>
      <b>제6조 (물품반출동의서)</b> 전조의 상황 발생 시 회사는 물품을 회수할 수 있습니다.<br><br>
      <b>제7조 (준수사항)</b> 가맹점은 등록된 정보를 외부에 누설하거나 승인 없이 수리·개조를 시켜서는 안 됩니다. 서명패드에 싸인을 받아야 하며 무서명 시 발생하는 손실을 책임집니다.
    </div></td>
    <td style="width:50%;vertical-align:top;border:none;padding-left:6px;"><div class="pc-terms">
      <b>제8조 (매출전표의 관리)</b> 가맹점은 여신전문금융법 및 기타 관련법령에 규정된 의무사항을 준수하여야 합니다. 자동이체 수수료는 1년 단위로 자동 연장되며 해지 시에는 7일 전 서면으로 접수해야 합니다.<br><br>
      <b>제9조 (유지보수)</b> 제품설치 후 1년간 자체 하자 발생 시 무상으로 수리합니다. 다만 사용자 부주의로 인한 하자 발생 시는 실비를 청구할 수 있습니다. 무상서비스 기간 1년 이후 출장비가 청구됩니다.<br><br>
      <b>제10조 (이용계약 해지)</b> 해지를 원하는 날로부터 7일 이전에 회사에 해지 요청을 하여야 하며 잔여기간 요금을 완납하여야 합니다.<br><br>
      <b>제11조 (손해배상)</b> 계약 위반 시 공급금액의 2배를 배상합니다. 약정건수 미달 시 건당 90원 페널티를 부담합니다. 물품 반환 불가 시 소비자가격(부가세 포함)의 2배를 배상합니다.<br><br>
      <b>제12조 (면책조항)</b> 천재지변, 불가항력, 은행·카드사 오류, 가맹점 귀책사유로 인한 손해에 대하여는 회사가 책임을 지지 않습니다.<br><br>
      <b>제13조 (해석 및 관할법원)</b> 분쟁 시 합의에 이르지 못할 경우 법원의 관할은 "갑"의 사업장 주소지 관할법원으로 합니다.<br><br>
      <div style="text-align:right;margin-top:8px;">대표자 &nbsp;<span style="border-bottom:1px solid #000;padding:0 30px;"></span>&nbsp; (인)</div>
    </div></td>
  </tr></table>
</div>`;
}

function printContract(){if(!currentContract)return;document.getElementById('printArea').innerHTML=buildContractHTML(currentContract);closeModal();setTimeout(()=>window.print(),200);}
function savePDF(){showToast('🖨️ 인쇄 화면에서 "PDF로 저장"을 선택하세요');printContract();}
function customerPrint(){
  if(currentContract){
    document.getElementById('printArea').innerHTML=buildContractHTML(currentContract);
    showToast('🖨️ 인쇄 화면에서 "PDF로 저장"을 선택하세요');
    setTimeout(()=>window.print(),300);
  } else {
    showToast('저장된 계약서가 없습니다');
  }
}

/* ── 공유 ── */
let shareTarget = '';

function shareScreen(target){
  shareTarget = target;
  const isSign = target === 'customer';
  const baseUrl = 'https://daesang-contract.web.app';

  document.getElementById('shareTitle').textContent = isSign ? '✍️ 서명 링크 공유' : '👤 계약서 조회 링크 공유';
  document.getElementById('shareDesc').textContent = isSign
    ? '고객에게 아래 링크를 보내면 핸드폰에서 바로 서명할 수 있습니다.'
    : '고객에게 아래 링크를 보내면 사업자번호+대표자 성함으로 계약서를 조회할 수 있습니다.';

  const shareNote = document.getElementById('shareNote');
  if (shareNote) {
    shareNote.textContent = isSign
      ? '📌 링크를 열면 바로 서명 화면으로 이동합니다'
      : '📌 링크를 열면 바로 계약서 조회 화면으로 이동합니다';
  }

  if (db && isSign) {
    const fields = [
      'c_company','c_owner','c_bizno','c_tel','c_mobile',
      'c_email','c_addr','c_bank','c_account','c_depositor',
      'c_monthly','c_period','c_payday','c_memo',
      'qty_pos','price_pos','mgt_pos',
      'qty_kiosk','price_kiosk','mgt_kiosk',
      'qty_table','price_table','mgt_table',
      'qty_qr','price_qr','mgt_qr',
      'qty_card','price_card','mgt_card'
    ];

    const data = {};
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value) data[id] = el.value;
    });

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    db.ref('tempForms/' + code).set({ data, ts: Date.now() })
      .then(() => {
        document.getElementById('shareLinkInput').value = baseUrl + '?ref=' + code;
        document.getElementById('shareModal').classList.add('open');
      })
      .catch(() => {
        const params = new URLSearchParams();
        params.set('screen', target);
        fields.forEach(id => {
          const el = document.getElementById(id);
          if (el && el.value) params.set(id, el.value);
        });
        document.getElementById('shareLinkInput').value = baseUrl + '?' + params.toString();
        document.getElementById('shareModal').classList.add('open');
      });
  } else {
    const params = new URLSearchParams();
    params.set('screen', target);
    if (isSign) {
      const fields = [
        'c_company','c_owner','c_bizno','c_tel','c_mobile',
        'c_email','c_addr','c_bank','c_account','c_depositor',
        'c_monthly','c_period','c_payday','c_memo',
        'qty_pos','price_pos','mgt_pos',
        'qty_kiosk','price_kiosk','mgt_kiosk',
        'qty_table','price_table','mgt_table',
        'qty_qr','price_qr','mgt_qr',
        'qty_card','price_card','mgt_card'
      ];
      fields.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value) params.set(id, el.value);
      });
    }
    const url = baseUrl + '?' + params.toString();
    document.getElementById('shareLinkInput').value = url;
    document.getElementById('shareModal').classList.add('open');
  }
}

function closeShareModal(){document.getElementById('shareModal').classList.remove('open');}

function copyLink(){
  const input = document.getElementById('shareLinkInput');
  input.select();
  try {
    navigator.clipboard.writeText(input.value).then(()=>showToast('✅ 링크가 복사되었습니다!'));
  } catch(e){
    document.execCommand('copy');
    showToast('✅ 링크가 복사되었습니다!');
  }
}

function shareKakao(){
  const url = document.getElementById('shareLinkInput').value;
  const isSign = shareTarget === 'customer';
  const text = isSign
    ? '[대상정보통신] 전자서명 계약서 서명 요청\n아래 링크를 클릭하여 계약서에 서명해 주세요.\n\n' + url
    : '[대상정보통신] 계약서 조회\n사업자번호+대표자 성함으로 계약서를 확인하세요.\n\n' + url;
  const kakaoUrl = 'kakaolink://send?text=' + encodeURIComponent(text);
  const fallback = 'https://sharer.kakao.com/talk/friends/picker/link?url=' + encodeURIComponent(url);
  const a = document.createElement('a'); a.href = kakaoUrl;
  try { a.click(); } catch(e){}
  setTimeout(()=>{ window.open(fallback,'_blank'); }, 500);
  showToast('카카오톡 앱이 열립니다');
}

function shareSMS(){
  const url = document.getElementById('shareLinkInput').value;
  const isSign = shareTarget === 'customer';
  const text = isSign
    ? '[대상정보통신] 전자서명 계약서 서명 링크입니다. 아래 링크를 눌러 서명해 주세요: ' + url
    : '[대상정보통신] 계약서 조회 링크입니다. 사업자번호+대표자 성함으로 확인하세요: ' + url;
  window.open('sms:?body=' + encodeURIComponent(text));
  showToast('문자 앱이 열립니다');
}

function shareNative(){
  const url = document.getElementById('shareLinkInput').value;
  const isSign = shareTarget === 'customer';
  const title = isSign ? '전자서명 계약서 서명 요청' : '계약서 조회';
  const text = isSign
    ? '[대상정보통신] 전자서명 계약서 서명 요청입니다. 링크를 눌러 서명해 주세요.'
    : '[대상정보통신] 계약서 조회 링크입니다. 사업자번호+대표자 성함으로 확인하세요.';
  if(navigator.share){
    navigator.share({title,text,url}).catch(()=>copyLink());
  } else {
    copyLink();
    showToast('이 브라우저는 공유를 지원하지 않아 링크를 복사했습니다');
  }
}

/* ── 딥링크 ── */
function checkDeepLink(){
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  const screen = params.get('screen');

  if (ref) {
    showScreen('customer');

    if (db) {
      db.ref('tempForms/' + ref).once('value').then(snap => {
        if (!snap.exists()) return;

        const data = snap.val().data || {};
        const fields = [
          'c_company','c_owner','c_bizno','c_tel','c_mobile',
          'c_email','c_addr','c_bank','c_account','c_depositor',
          'c_monthly','c_period','c_payday','c_memo',
          'qty_pos','price_pos','mgt_pos',
          'qty_kiosk','price_kiosk','mgt_kiosk',
          'qty_table','price_table','mgt_table',
          'qty_qr','price_qr','mgt_qr',
          'qty_card','price_card','mgt_card'
        ];

        fields.forEach(id => {
          const el = document.getElementById(id);
          if (el && data[id] !== undefined) el.value = data[id];
        });
      });
    }
    return;
  }

  if (screen === 'customer' || screen === 'mypage') {
    showScreen(screen);
  }

  if (screen === 'customer') {
    const fields = [
      'c_company','c_owner','c_bizno','c_tel','c_mobile',
      'c_email','c_addr','c_bank','c_account','c_depositor',
      'c_monthly','c_period','c_payday','c_memo',
      'qty_pos','price_pos','mgt_pos',
      'qty_kiosk','price_kiosk','mgt_kiosk',
      'qty_table','price_table','mgt_table',
      'qty_qr','price_qr','mgt_qr',
      'qty_card','price_card','mgt_card'
    ];

    fields.forEach(id => {
      const el = document.getElementById(id);
      const val = params.get(id);
      if (el && val !== null) el.value = val;
    });
  }
}

/* ── 유틸 ── */
function showLoading(msg){document.getElementById('loadingText').textContent=msg||'처리 중...';document.getElementById('loading').classList.add('show');}
function hideLoading(){document.getElementById('loading').classList.remove('show');}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800);}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

/* ── 이벤트 바인딩 ── */
window.addEventListener('load', () => {
  initSigPad();
  checkDeepLink();

  window.addEventListener('resize', () => {
    if(document.getElementById('customer').classList.contains('active')) initSigPad();
  });

  /* 홈 카드 */
  document.getElementById('card-customer').addEventListener('click', () => showScreen('customer'));
  document.getElementById('card-admin').addEventListener('click', () => showScreen('admin'));
  document.getElementById('card-mypage').addEventListener('click', () => showScreen('mypage'));

  /* 계약서 작성 화면 */
  document.getElementById('btn-share-customer').addEventListener('click', () => shareScreen('customer'));
  document.getElementById('btn-home-from-customer').addEventListener('click', () => showScreen('home'));
  document.getElementById('btn-sig-clear').addEventListener('click', clearSig);
  document.getElementById('btn-sig-undo').addEventListener('click', undoSig);
  document.getElementById('btn-submit').addEventListener('click', submitContract);
  document.getElementById('chk_all').addEventListener('change', function(){ toggleAllChecks(this); });

  /* 성공 화면 */
  document.getElementById('btn-customer-print').addEventListener('click', customerPrint);
  document.getElementById('btn-home-from-success').addEventListener('click', () => showScreen('home'));

  /* 관리자 화면 */
  document.getElementById('btn-home-from-admin').addEventListener('click', () => showScreen('home'));
  document.getElementById('adminEmail').addEventListener('keydown', e => { if(e.key==='Enter') checkLogin(); });
  document.getElementById('adminPw').addEventListener('keydown', e => { if(e.key==='Enter') checkLogin(); });
  document.getElementById('btn-admin-login').addEventListener('click', checkLogin);
  document.getElementById('btn-admin-reset').addEventListener('click', resetPassword);
  document.getElementById('btn-admin-logout').addEventListener('click', adminLogout);
  document.getElementById('btn-admin-refresh').addEventListener('click', loadAdminData);
  document.getElementById('btn-filter').addEventListener('click', applyFilter);
  document.getElementById('btn-export').addEventListener('click', exportExcel);

  /* 관리자 탭 (이벤트 위임) */
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', function(){ switchAdminTab(this.dataset.panel, this); });
  });

  /* 계약 목록 클릭 (이벤트 위임) */
  document.getElementById('contractList').addEventListener('click', e => {
    const item = e.target.closest('.contract-item');
    if(item) openDetail(item.dataset.id, item.dataset.actions === 'true');
  });
  document.getElementById('expireList').addEventListener('click', e => {
    const item = e.target.closest('.contract-item');
    if(item) openDetail(item.dataset.id, true);
  });

  /* 마이페이지 */
  document.getElementById('btn-share-mypage').addEventListener('click', () => shareScreen('mypage'));
  document.getElementById('btn-home-from-mypage').addEventListener('click', () => showScreen('home'));
  document.getElementById('btn-mypage-login').addEventListener('click', mypageLogin);
  document.getElementById('my_bizno').addEventListener('keydown', e => { if(e.key==='Enter') mypageLogin(); });
  document.getElementById('my_owner').addEventListener('keydown', e => { if(e.key==='Enter') mypageLogin(); });
  document.getElementById('btn-mypage-logout').addEventListener('click', mypageLogout);

  /* 마이페이지 계약 목록 클릭 (이벤트 위임) */
  document.getElementById('mypageList').addEventListener('click', e => {
    const item = e.target.closest('.contract-item');
    if(item) openDetail(item.dataset.id, false);
  });

  /* 상세 모달 */
  document.getElementById('detailModal').addEventListener('click', function(e){ if(e.target===this) closeModal(); });
  document.getElementById('btn-modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-modal-print').addEventListener('click', printContract);
  document.getElementById('btn-modal-pdf').addEventListener('click', savePDF);
  document.getElementById('btn-modal-email').addEventListener('click', sendEmail);

  /* 공유 모달 */
  document.getElementById('shareModal').addEventListener('click', function(e){ if(e.target===this) closeShareModal(); });
  document.getElementById('btn-share-close').addEventListener('click', closeShareModal);
  document.getElementById('btn-copy-link').addEventListener('click', copyLink);
  document.getElementById('btn-share-kakao').addEventListener('click', shareKakao);
  document.getElementById('btn-share-sms').addEventListener('click', shareSMS);
  document.getElementById('btn-share-native').addEventListener('click', shareNative);
});
