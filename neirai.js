const params=new URLSearchParams(location.search);
const returnTo=params.get("from");
const closeLink=document.querySelector(".neirai-close");
if(closeLink&&returnTo){try{const u=new URL(returnTo,location.href);if(u.origin===location.origin)closeLink.href=u.href}catch(e){}}
if(closeLink){closeLink.addEventListener("click",e=>{if(returnTo&&history.length>1){e.preventDefault();history.back()}})}

const API_URL="https://neirai-knowledge.vercel.app/api/chat";
const conversation=document.getElementById("neirai-conversation");
const welcome=document.getElementById("neirai-welcome");
const followups=document.getElementById("neirai-followups");
const form=document.getElementById("neirai-chat-form");
const input=document.getElementById("neirai-input");
let isSending=false;

function resizeInput(){input.style.height="auto";input.style.height=Math.min(input.scrollHeight,160)+"px"}
input.addEventListener("input",resizeInput);
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask(input.value)}});

function addMessage(role,text,links=[]){
 const wrap=document.createElement("div");wrap.className="neirai-message "+role;
 const label=document.createElement("span");label.className="neirai-message-label";label.textContent=role==="user"?"You":"NeirAI ✦";wrap.appendChild(label);
 const bubble=document.createElement("div");bubble.className="neirai-bubble";
 String(text).split("\n\n").forEach(t=>{const p=document.createElement("p");p.textContent=t;bubble.appendChild(p)});
 if(links.length){const box=document.createElement("div");box.className="neirai-links";links.forEach(([label,url])=>{const a=document.createElement("a");a.href=url;a.textContent=label+" ↗";box.appendChild(a)});bubble.appendChild(box)}
 wrap.appendChild(bubble);conversation.appendChild(wrap);conversation.scrollTop=conversation.scrollHeight;
}

function showFollowups(items=[]){
 followups.innerHTML="";
 if(!items.length){followups.hidden=true;return}
 followups.hidden=false;
 const label=document.createElement("span");label.textContent="You might also ask";followups.appendChild(label);
 items.forEach(q=>{const b=document.createElement("button");b.type="button";b.textContent=q;b.onclick=()=>ask(q);followups.appendChild(b)});
}

function followupsFor(q){
 const s=q.toLowerCase();
 if(/api|integration|rest|event/.test(s))return["What technical decisions did she make?","How technical is Neira?","How does she work with engineers?"];
 if(/ai|agent|llm|automation|prototype/.test(s))return["What AI workflows has she built?","How hands-on is she with AI?","What has Neira built from 0→1?"];
 if(/0.?1|built|build|product/.test(s))return["What technical decisions did she make on SIMS?","Has she worked directly with customers?","Tell me about her cloud platform work."];
 if(/cowork|colleague|feedback|reference/.test(s))return["What leadership experience does she have?","How does she work cross-functionally?","What makes her different as a PM?"];
 return["How technical is Neira?","What has Neira built from 0→1?","Tell me about Neira’s AI experience."];
}

async function ask(q){
 q=(q||"").trim();
 if(!q||isSending)return;
 isSending=true;
 if(welcome)welcome.hidden=true;
 followups.hidden=true;
 addMessage("user",q);
 input.value="";resizeInput();
 const typing=document.createElement("div");typing.className="neirai-typing";typing.textContent="NeirAI is looking through Neira’s experience…";conversation.appendChild(typing);conversation.scrollTop=conversation.scrollHeight;
 try{
   const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q})});
   const data=await response.json().catch(()=>({}));
   typing.remove();
   if(!response.ok)throw new Error(data.error||"NeirAI is temporarily unavailable.");
   addMessage("assistant",data.answer);
   showFollowups(followupsFor(q));
 }catch(err){
   typing.remove();
   addMessage("assistant","I’m having trouble reaching NeirAI right now. Please try again in a moment.");
   showFollowups([]);
 }finally{
   isSending=false;
   input.focus();
 }
}

document.querySelectorAll("[data-neirai-question]").forEach(b=>b.addEventListener("click",()=>ask(b.dataset.neiraiQuestion)));
form.addEventListener("submit",e=>{e.preventDefault();ask(input.value)});
const initial=params.get("q");if(initial)ask(initial);
