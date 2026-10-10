const USERS=[{u:"admin",p:"admin123",role:"admin"},{u:"cashier",p:"1234",role:"user"}];
let mem={};
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):(mem[k]??d)}catch(e){return mem[k]??d}},
set(k,v){mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let items=store.get("items",[{id:1,name:"Rice 1kg",price:85,qty:100,bal:100},{id:2,name:"Sugar 1kg",price:70,qty:60,bal:48},{id:3,name:"Cooking oil 1L",price:190,qty:30,bal:4}]);
let sales=store.get("sales",[]);
items.forEach(i=>{if(!i.pd)i.pd=Date.now()});
sales.forEach(s=>{if(s.pm===undefined){s.pm="cash";s.cash=s.total;s.tr=0;s.fs="-"}});
let editing=null;
let zs=store.get("z",[]);
let session=null,msg={t:"",c:""};
const $=s=>document.querySelector(s);
const money=n=>Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const save=()=>{store.set("items",items);store.set("sales",sales);store.set("z",zs)};
const pad=n=>String(n).padStart(2,"0");
const dayStr=ms=>{const d=new Date(ms);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
const nowLocal=()=>{const d=new Date();return dayStr(d)+"T"+pad(d.getHours())+":"+pad(d.getMinutes())};
const fmtD=ms=>ms?new Date(ms).toLocaleDateString():"-";
const pmL={cash:"Cash",transfer:"Transfer",both:"Cash + transfer"};
let xr={from:dayStr(Date.now()),to:dayStr(Date.now())};
const curTotal=()=>{const it=items.find(x=>x.id==$("#si").value);return it?+(it.price*(+$("#sq").value||0)).toFixed(2):0};
const say=(t,c)=>{msg={t,c}};

function render(){
  const app=$("#app");
  if(!session){app.innerHTML=`<div class="card login"><h1>Sales & Stock Portal</h1><p class="who">Sign in to continue</p>
  <label>Username</label><input id="lu" autocomplete="username"><div style="height:10px"></div>
  <label>Password</label><input id="lp" type="password" autocomplete="current-password"><div style="height:14px"></div>
  <button id="lgo" style="width:100%">Sign in</button><div class="msg err">${esc(msg.t)}</div>
  <div class="hint">Demo accounts: admin / admin123 (manages stock), cashier / 1234 (sells and views balance).</div></div>`;
  $("#lgo").onclick=login;$("#lp").onkeydown=e=>{if(e.key==="Enter")login()};return}
  const admin=session.role==="admin";
  const totalRev=sales.reduce((a,s)=>a+s.total,0);
  const units=items.reduce((a,i)=>a+i.bal,0);
  const value=items.reduce((a,i)=>a+i.bal*i.price,0);
  app.innerHTML=`<header><div><h1>Sales & Stock Portal</h1><span class="who">${esc(session.u)} <span class="tag">${admin?"Admin":"Sales user"}</span></span></div><button class="ghost" id="out">Sign out</button></header>
  <div class="grid card">
   <div class="stat"><b>${items.length}</b><span>Items</span></div>
   <div class="stat"><b>${units}</b><span>Units available</span></div>
   <div class="stat"><b>${money(value)}</b><span>Stock value</span></div>
   ${admin?`<div class="stat"><b>${money(totalRev)}</b><span>Total sales</span></div>`:""}
  </div>
  ${admin?"":`<div class="card"><h2>Make a sale</h2>
   <div class="row"><div><label>Item</label><select id="si">${items.map(i=>`<option value="${i.id}" ${i.bal<1?"disabled":""}>${esc(i.name)} (${i.bal} left)</option>`).join("")}</select></div>
   <div><label>Quantity</label><input id="sq" type="number" min="1" value="1"></div>
   <div><label>Total</label><input id="st" readonly></div>
   </div>
   <div class="row" style="margin-top:10px"><div><label>Sale date</label><input id="sd" type="datetime-local" value="${nowLocal()}"></div>
   <div><label>FS number</label><input id="sf" inputmode="numeric" placeholder="e.g. 00012345"></div>
   <div><label>Payment</label><select id="sp"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="both">Cash + transfer</option></select></div>
   <div id="wb" class="row" style="display:none;flex:2"><div><label>Cash amount</label><input id="sc" type="number" min="0" step="0.01"></div><div><label>Transfer amount</label><input id="stf" type="number" min="0" step="0.01"></div></div>
   <div style="flex:0"><button id="sell">Sell</button></div></div>
   <div class="msg ${msg.c}" id="smsg">${esc(msg.t)}</div></div>`}
  ${admin?`<div class="card"><h2>Add item</h2>
   <div class="row"><div><label>Item name</label><input id="an"></div><div><label>Price</label><input id="ap" type="number" min="0" step="0.01"></div>
   <div><label>Quantity</label><input id="aq" type="number" min="0"></div><div><label>Available balance</label><input id="ab" type="number" min="0" placeholder="Same as quantity"></div><div><label>Price date</label><input id="ad" type="date" value="${dayStr(Date.now())}"></div>
   <div style="flex:0"><button id="add">Add item</button></div></div></div>`:""}
  ${admin?`<div class="msg ${msg.c}">${esc(msg.t)}</div>`+xReport()+(editing?editCard():""):""}<div class="card"><h2>${admin?"Stock":"Available balance"}</h2><div class="scroll"><table>
   <tr><th>Item</th><th class="n">Price</th><th>Price updated</th>${admin?'<th class="n">Quantity</th>':""}<th class="n">Available</th>${admin?"<th></th>":""}</tr>
   ${items.length?items.map(i=>`<tr class="${i.bal<=5?"low":""}"><td>${esc(i.name)}${i.bal<=5?` <span class="tag">${i.bal<1?"Out of stock":"Low"}</span>`:""}</td><td class="n">${money(i.price)}</td><td>${fmtD(i.pd)}</td>${admin?`<td class="n">${i.qty}</td>`:""}<td class="n">${i.bal}</td>
   ${admin?`<td class="n"><button class="sm ghost" data-e="${i.id}">Edit</button> <button class="sm del" data-d="${i.id}">Delete</button></td>`:""}</tr>`).join(""):`<tr><td colspan="5">No items yet.${admin?" Add your first item above.":" Ask an admin to add items."}</td></tr>`}
  </table></div></div>
  <div class="card"><h2>${admin?"All sales":"My sales"}</h2><div class="scroll"><table>
   <tr><th>Date</th><th>FS no.</th><th>Item</th><th class="n">Qty</th><th class="n">Total</th><th>Payment</th><th>Cashier</th></tr>
   ${(admin?sales:sales.filter(s=>s.by===session.u)).slice().reverse().slice(0,50).map(s=>`<tr><td>${new Date(s.at).toLocaleString()}</td><td>${esc(s.fs)}</td><td>${esc(s.name)}</td><td class="n">${s.q}</td><td class="n">${money(s.total)}</td><td>${pmL[s.pm]}${s.pm==="both"?` (${money(s.cash)} + ${money(s.tr)})`:""}</td><td>${esc(s.by)}</td></tr>`).join("")||`<tr><td colspan="7">No sales yet.</td></tr>`}
  </table></div></div>`;
  $("#out").onclick=()=>{session=null;say("","");render()};
  if(!admin){const upd=()=>{const it=items.find(x=>x.id==$("#si").value);$("#st").value=it?money(it.price*(+$("#sq").value||0)):""};
  $("#si").onchange=upd;$("#sq").oninput=upd;upd();$("#sell").onclick=sell;
  $("#sp").onchange=()=>{$("#wb").style.display=$("#sp").value==="both"?"flex":"none"};
  $("#sc").oninput=()=>{$("#stf").value=Math.max(0,+(curTotal()-(+$("#sc").value||0)).toFixed(2))};}
  if(admin){$("#add").onclick=addItem;$("#xprint").onclick=()=>printHtml(repBody(openL(),"X-report","Printed "+new Date().toLocaleString()+". Sales since the last Z-report.",""));$("#zclose").onclick=closeZ;document.querySelectorAll("[data-zp]").forEach(b=>b.onclick=()=>printHtml(zBody(+b.dataset.zp)));if(editing){$("#esave").onclick=saveEdit;$("#ecancel").onclick=()=>{editing=null;render()}}
    document.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{const it=items.find(x=>x.id==b.dataset.d);if(confirm("Delete "+it.name+"?")){items=items.filter(x=>x!==it);save();say("Deleted "+it.name+".","ok");render()}});
    document.querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>editItem(+b.dataset.e));}
}
function login(){const u=USERS.find(x=>x.u===$("#lu").value.trim().toLowerCase()&&x.p===$("#lp").value);
  if(!u){say("Wrong username or password.","err");render();return}session=u;say("","");render()}
function sell(){if(session.role==="admin")return;const it=items.find(x=>x.id==$("#si").value),q=parseInt($("#sq").value);
  if(!it||!(q>0)){say("Choose an item and enter a quantity of 1 or more.","err");render();return}
  if(q>it.bal){say(`Only ${it.bal} of ${it.name} available.`,"err");render();return}
  const total=+(q*it.price).toFixed(2),fs=$("#sf").value.trim(),pm=$("#sp").value,at=new Date($("#sd").value).getTime(),fail=t=>{const m=$("#smsg");m.className="msg err";m.textContent=t};
  if(!fs)return fail("Enter the FS number.");
  if(sales.some(s=>s.fs===fs))return fail("FS number "+fs+" is already used.");
  if(isNaN(at))return fail("Enter the sale date.");
  let cash=0,tr=0;if(pm==="cash")cash=total;else if(pm==="transfer")tr=total;else{cash=+$("#sc").value||0;tr=+$("#stf").value||0}
  if(Math.abs(cash+tr-total)>0.005)return fail("Cash + transfer ("+money(cash+tr)+") must equal the total ("+money(total)+").");
  it.bal-=q;sales.push({name:it.name,q,total,fs,pm,cash,tr,by:session.u,at});save();
  say(`Sold ${q} × ${it.name} for ${money(q*it.price)}.`,"ok");render()}
function addItem(){const name=$("#an").value.trim(),price=parseFloat($("#ap").value),qty=parseInt($("#aq").value),b=$("#ab").value;
  const bal=b===""?qty:parseInt(b);
  if(!name||!(price>=0)||!(qty>=0)||!(bal>=0)){say("Enter a name, price and quantity.","err");render();return}
  const pd=$("#ad").value?new Date($("#ad").value+"T00:00").getTime():Date.now();items.push({id:Date.now(),name,price,qty,bal,pd});save();say(`Added ${name}.`,"ok");render()}
const openL=()=>sales.filter(s=>!s.z).sort((a,b)=>a.at-b.at);
const zBody=no=>{const z=zs.find(x=>x.no===no);return repBody(sales.filter(s=>s.z===no).sort((a,b)=>a.at-b.at),"Z-report #"+no,"Closed "+new Date(z.at).toLocaleString()+". Final report for this period.","")};
function printHtml(h){$("#pa").innerHTML=h;window.onafterprint=()=>{$("#pa").innerHTML=""};window.print()}
function xReport(){return repBody(openL(),"X-report (since last Z-report)","Interim report generated "+new Date().toLocaleString()+". It does not reset any totals.",`<div class="row" style="margin-top:10px"><div style="flex:0"><button class="ghost sm" id="xprint">Print X-report</button></div><div style="flex:0"><button class="sm" id="zclose">Close day (Z-report)</button></div></div>`)+zHistory()}
function zHistory(){return `<div class="card"><h2>Z-reports</h2><div class="scroll"><table><tr><th>Z no.</th><th>Closed</th><th class="n">Receipts</th><th class="n">Total</th><th></th></tr>${zs.slice().reverse().map(z=>`<tr><td>${z.no}</td><td>${new Date(z.at).toLocaleString()}</td><td class="n">${z.n}</td><td class="n">${money(z.total)}</td><td class="n"><button class="sm ghost" data-zp="${z.no}">Print</button></td></tr>`).join("")||`<tr><td colspan="5">No Z-reports yet. Closing the day creates one.</td></tr>`}</table></div></div>`}
function closeZ(){const L=openL();if(!L.length){say("No open sales to close.","err");render();return}
  const no=zs.length+1;if(!confirm("Close the day? This creates Z-report #"+no+" and resets the X-report."))return;
  L.forEach(s=>s.z=no);zs.push({no,at:Date.now(),n:L.length,total:L.reduce((a,s)=>a+s.total,0)});save();say("Z-report #"+no+" created. Print it from the list below.","ok");render()}
function editItem(id){editing=id;render();const e=$("#ecard");if(e)e.scrollIntoView({block:"center"})}
function editCard(){const i=items.find(x=>x.id===editing);if(!i)return"";
  return `<div class="card" id="ecard"><h2>Edit item</h2><div class="row"><div><label>Item name</label><input id="en" value="${esc(i.name)}"></div><div><label>Price</label><input id="ep" type="number" min="0" step="0.01" value="${i.price}"></div><div><label>Quantity</label><input id="eq" type="number" min="0" value="${i.qty}"></div><div><label>Available balance</label><input id="eb" type="number" min="0" value="${i.bal}"></div><div><label>New price date</label><input id="ed" type="date" value="${dayStr(Date.now())}"></div></div><div class="hint">The price date changes only if you change the price. Current price date: ${fmtD(i.pd)}.</div><div class="msg err" id="emsg"></div><div><button id="esave">Save changes</button> <button class="ghost" id="ecancel">Cancel</button></div></div>`}
function saveEdit(){const it=items.find(x=>x.id===editing);if(!it)return;
  const n=$("#en").value.trim(),p=parseFloat($("#ep").value),q=parseInt($("#eq").value),b=parseInt($("#eb").value);
  if(!n||!(p>=0)||!(q>=0)||!(b>=0)){$("#emsg").textContent="Enter a name and valid numbers.";return}
  if(p!==it.price)it.pd=$("#ed").value?new Date($("#ed").value+"T00:00").getTime():Date.now();
  Object.assign(it,{name:n,price:p,qty:q,bal:b});editing=null;save();say("Item updated.","ok");render()}
function repBody(L,title,sub,actions){
  const sum=k=>L.reduce((n,s)=>n+s[k],0);
  const rows=k=>{const m={};L.forEach(s=>{const o=m[s[k]]=m[s[k]]||{n:0,q:0,cash:0,tr:0,total:0};o.n++;o.q+=s.q;o.cash+=s.cash;o.tr+=s.tr;o.total+=s.total});
    return Object.entries(m).map(([n,o])=>`<tr><td>${esc(n)}</td><td class="n">${o.n}</td><td class="n">${o.q}</td><td class="n">${money(o.cash)}</td><td class="n">${money(o.tr)}</td><td class="n">${money(o.total)}</td></tr>`).join("")||`<tr><td colspan="6">No sales in this period.</td></tr>`};
  const head=w=>`<tr><th>${w}</th><th class="n">Receipts</th><th class="n">Units</th><th class="n">Cash</th><th class="n">Transfer</th><th class="n">Total</th></tr>`;
  return `<div class="card"><h2>${title}</h2><div class="hint">${sub}</div>${actions}
  <div class="grid" style="margin:12px 0"><div class="stat"><b>${L.length}</b><span>Receipts</span></div><div class="stat"><b>${sum("q")}</b><span>Units sold</span></div><div class="stat"><b>${money(sum("cash"))}</b><span>Cash</span></div><div class="stat"><b>${money(sum("tr"))}</b><span>Transfer</span></div><div class="stat"><b>${money(sum("total"))}</b><span>Total sales</span></div><div class="stat"><b style="font-size:16px">${L.length?esc(L[0].fs)+" to "+esc(L[L.length-1].fs):"-"}</b><span>FS range</span></div></div>
  <div class="scroll"><table>${head("Cashier")}${rows("by")}</table></div><div style="height:12px"></div><div class="scroll"><table>${head("Item")}${rows("name")}</table></div></div>`}
render();
