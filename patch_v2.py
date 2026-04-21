with open('public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

results = []

# =====================================================
# 패치 1: 제품명을 클릭해서 수정 가능한 input으로 변경
# =====================================================
old1 = '''            <tr><td>POS</td><td><input class="tinput" id="qty_pos"/></td><td><input class="pinput" id="price_pos" placeholder="0"/></td><td><select class="type-select" id="type_pos"><option value="임대">임대</option><option value="구매">구매</option><option value="판매+임대">판매+임대</option></select></td><td><input class="pinput" id="mgt_pos" placeholder="0"/></td></tr>
            <tr><td>키오스크</td><td><input class="tinput" id="qty_kiosk"/></td><td><input class="pinput" id="price_kiosk" placeholder="0"/></td><td><select class="type-select" id="type_kiosk"><option value="임대">임대</option><option value="구매">구매</option><option value="판매+임대">판매+임대</option></select></td><td><input class="pinput" id="mgt_kiosk" placeholder="0"/></td></tr>
            <tr><td>테이블오더</td><td><input class="tinput" id="qty_table"/></td><td><input class="pinput" id="price_table" placeholder="0"/></td><td><select class="type-select" id="type_table"><option value="임대">임대</option><option value="구매">구매</option><option value="판매+임대">판매+임대</option></select></td><td><input class="pinput" id="mgt_table" placeholder="0"/></td></tr>
            <tr><td>QR오더</td><td><input class="tinput" id="qty_qr"/></td><td><input class="pinput" id="price_qr" placeholder="0"/></td><td><select class="type-select" id="type_qr"><option value="임대">임대</option><option value="구매">구매</option><option value="판매+임대">판매+임대</option></select></td><td><input class="pinput" id="mgt_qr" placeholder="0"/></td></tr>
            <tr><td>카드단말기</td><td><input class="tinput" id="qty_card"/></td><td><input class="pinput" id="price_card" placeholder="0"/></td><td><select class="type-select" id="type_card"><option value="임대">임대</option><option value="구매">구매</option><option value="판매+임대">판매+임대</option></select></td><td><input class="pinput" id="mgt_card" placeholder="0"/></td></tr>'''

new1 = '''            <tr><td><input class="tinput" id="name_pos" value="POS" style="width:60px;text-align:center;font-size:12px;"/></td><td><input class="tinput" id="qty_pos"/></td><td><input class="pinput" id="price_pos" placeholder="0" oninput="calcTotal()"/></td><td><select class="type-select" id="type_pos"><option value="임대">임대</option><option value="구매">구매</option><option value="판매+임대">판매+임대</option></select></td><td><input class="pinput" id="mgt_pos" placeholder="0" oninput="calcTotal()"/></td></tr>
            <tr><td><input class="tinput" id="name_kiosk" value="키오스크" style="width:60px;text-align:center;font-size:12px;"/></td><td><input class="tinput" id="qty_kiosk"/></td><td><input class="pinput" id="price_kiosk" placeholder="0" oninput="calcTotal()"/></td><td><select class="type-select" id="type_kiosk"><option value="임대">임대</option><option value="구매">구매</option><option value="판매+임대">판매+임대</option></select></td><td><input class="pinput" id="mgt_kiosk" placeholder="0" oninput="calcTotal()"/></td></tr>
            <tr><td><input class="tinput" id="name_table" value="테이블오더" style="width:60px;text-align:center;font-size:12px;"/></td><td><input class="tinput" id="qty_table"/></td><td><input class="pinput" id="price_table" placeholder="0" oninput="calcTotal()"/></td><td><select class="type-select" id="type_table"><option value="임대">임대</option><option value="구매">구매</option><option value="판매+임대">판매+임대</option></select></td><td><input class="pinput" id="mgt_table" placeholder="0" oninput="calcTotal()"/></td></tr>
            <tr><td><input class="tinput" id="name_qr" value="QR오더" style="width:60px;text-align:center;font-size:12px;"/></td><td><input class="tinput" id="qty_qr"/></td><td><input class="pinput" id="price_qr" placeholder="0" oninput="calcTotal()"/></td><td><select class="type-select" id="type_qr"><option value="임대">임대</option><option value="구매">구매</option><option value="판매+임대">판매+임대</option></select></td><td><input class="pinput" id="mgt_qr" placeholder="0" oninput="calcTotal()"/></td></tr>
            <tr><td><input class="tinput" id="name_card" value="카드단말기" style="width:60px;text-align:center;font-size:12px;"/></td><td><input class="tinput" id="qty_card"/></td><td><input class="pinput" id="price_card" placeholder="0" oninput="calcTotal()"/></td><td><select class="type-select" id="type_card"><option value="임대">임대</option><option value="구매">구매</option><option value="판매+임대">판매+임대</option></select></td><td><input class="pinput" id="mgt_card" placeholder="0" oninput="calcTotal()"/></td></tr>
            <tr style="background:var(--blue-light);font-weight:700;"><td style="text-align:center;font-size:12px;font-weight:800;">합계</td><td></td><td style="text-align:right;font-size:12px;" id="total_price">0</td><td></td><td style="text-align:right;font-size:12px;" id="total_mgt">0</td></tr>'''

if old1 in html:
    html = html.replace(old1, new1)
    results.append("패치1 ✅ 제품명 수정 가능 + 합계 행 추가")
else:
    results.append("패치1 ❌ 미발견")

# =====================================================
# 패치 2: 대표자명 입력 후 주민번호 앞자리 6자리 입력창 추가
# =====================================================
old2 = '          <div class="info-item"><span class="info-label">대표자명 *</span><input class="info-input" id="c_owner" placeholder="이름"/></div>'
new2 = '          <div class="info-item"><span class="info-label">대표자명 *</span><input class="info-input" id="c_owner" placeholder="이름" oninput="toggleJuminField(this)"/><div id="jumin_wrap" style="display:none;margin-top:4px;"><span class="info-label">주민번호 앞 6자리</span><input class="info-input" id="c_jumin" maxlength="6" inputmode="numeric" placeholder="YYMMDD" style="padding:6px 10px;font-size:12px;" oninput="this.value=this.value.replace(/[^0-9]/g,\'\')"/></div></div>'

if old2 in html:
    html = html.replace(old2, new2)
    results.append("패치2 ✅ 주민번호 앞자리 입력창 추가")
else:
    results.append("패치2 ❌ 미발견")

# =====================================================
# 패치 3: submitContract에서 제품명 동적값 + 주민번호 저장
# =====================================================
old3 = "    products:[\n      {name:'POS',qty:v('qty_pos'),price:v('price_pos'),mgt:v('mgt_pos'),type:sel('type_pos')},\n      {name:'키오스크',qty:v('qty_kiosk'),price:v('price_kiosk'),mgt:v('mgt_kiosk'),type:sel('type_kiosk')},\n      {name:'테이블오더',qty:v('qty_table'),price:v('price_table'),mgt:v('mgt_table'),type:sel('type_table')},\n      {name:'QR오더',qty:v('qty_qr'),price:v('price_qr'),mgt:v('mgt_qr'),type:sel('type_qr')},\n      {name:'카드단말기',qty:v('qty_card'),price:v('price_card'),mgt:v('mgt_card'),type:sel('type_card')},\n    ],"
new3 = "    products:[\n      {name:v('name_pos')||'POS',qty:v('qty_pos'),price:v('price_pos'),mgt:v('mgt_pos'),type:sel('type_pos')},\n      {name:v('name_kiosk')||'키오스크',qty:v('qty_kiosk'),price:v('price_kiosk'),mgt:v('mgt_kiosk'),type:sel('type_kiosk')},\n      {name:v('name_table')||'테이블오더',qty:v('qty_table'),price:v('price_table'),mgt:v('mgt_table'),type:sel('type_table')},\n      {name:v('name_qr')||'QR오더',qty:v('qty_qr'),price:v('price_qr'),mgt:v('mgt_qr'),type:sel('type_qr')},\n      {name:v('name_card')||'카드단말기',qty:v('qty_card'),price:v('price_card'),mgt:v('mgt_card'),type:sel('type_card')},\n    ],\n    jumin:v('c_jumin'),"

if old3 in html:
    html = html.replace(old3, new3)
    results.append("패치3 ✅ 제품명 동적값 + 주민번호 저장")
else:
    results.append("패치3 ❌ 미발견")

# =====================================================
# 패치 4: 인쇄 시 예금주 주민번호 칸에 값 반영
# =====================================================
old4 = "      <td class=\"label\">예금주 주민번호</td><td class=\"val\"></td>"
new4 = "      <td class=\"label\">예금주 주민번호</td><td class=\"val\">${c.jumin||''}</td>"

if old4 in html:
    html = html.replace(old4, new4)
    results.append("패치4 ✅ 인쇄 시 주민번호 반영")
else:
    results.append("패치4 ❌ 미발견")

# =====================================================
# 패치 5: JS 함수 추가 (합계계산 + 주민번호 토글)
# - parseAmt 함수 다음에 삽입
# =====================================================
old5 = "function parseAmt(v){return Number(String(v||'').replace(/,/g,''))||0;}"
new5 = """function parseAmt(v){return Number(String(v||'').replace(/,/g,''))||0;}

/* ── 합계 자동계산 ── */
function calcTotal(){
  const ids=['pos','kiosk','table','qr','card'];
  let tp=0,tm=0;
  ids.forEach(id=>{
    tp+=parseAmt(document.getElementById('price_'+id)?.value||'0');
    tm+=parseAmt(document.getElementById('mgt_'+id)?.value||'0');
  });
  const tpEl=document.getElementById('total_price');
  const tmEl=document.getElementById('total_mgt');
  if(tpEl)tpEl.textContent=tp?tp.toLocaleString():'0';
  if(tmEl)tmEl.textContent=tm?tm.toLocaleString()+'원':'0';
}

/* ── 주민번호 앞자리 입력창 토글 ── */
function toggleJuminField(el){
  const wrap=document.getElementById('jumin_wrap');
  if(wrap)wrap.style.display=el.value.trim()?'block':'none';
  /* 서명인 이름 동기화 */
  const nd=document.getElementById('sigNameDisplay');
  if(nd)nd.textContent=el.value||'-';
}"""

if old5 in html:
    html = html.replace(old5, new5)
    results.append("패치5 ✅ calcTotal + toggleJuminField 함수 추가")
else:
    results.append("패치5 ❌ 미발견")

# =====================================================
# 패치 6: c_owner input 이벤트에서 기존 sigNameDisplay 업데이트 제거
#         (toggleJuminField가 대신 처리하므로 이벤트 리스너 충돌 방지)
# =====================================================
old6 = "  /* 서명인 이름 실시간 표시 */\n  document.getElementById('c_owner').addEventListener('input', function(){\n    const nd=document.getElementById('sigNameDisplay');\n    if(nd) nd.textContent=this.value||'-';\n  });"
new6 = "  /* 서명인 이름 실시간 표시 - toggleJuminField에서 처리 */"

if old6 in html:
    html = html.replace(old6, new6)
    results.append("패치6 ✅ 이벤트 리스너 정리")
else:
    results.append("패치6 ⚠️ 미발견(무시가능)")

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("=== 패치 결과 ===")
for r in results:
    print(r)
print("\n저장 완료! public/index.html")
