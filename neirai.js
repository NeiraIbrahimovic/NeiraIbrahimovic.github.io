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
const chatHistory=[];

function resizeInput(){input.style.height="auto";input.style.height=Math.min(input.scrollHeight,160)+"px"}
input.addEventListener("input",resizeInput);
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ask(input.value)}});

function renderAnswer(text,bubble){
 const lines=String(text).replace(/\r/g,"").split("\n");
 let list=null;
 const addInline=(el,s)=>{
   const parts=s.split(/(\*\*[^*]+\*\*)/g);
   parts.forEach(part=>{if(part.startsWith("**")&&part.endsWith("**")){const strong=document.createElement("strong");strong.textContent=part.slice(2,-2);el.appendChild(strong)}else{el.appendChild(document.createTextNode(part))}});
 };
 for(const raw of lines){
   const line=raw.trim();
   if(!line){list=null;continue}
   const bullet=line.match(/^[-•]\s+(.*)$/);
   if(bullet){
     if(!list){list=document.createElement("ul");bubble.appendChild(list)}
     const li=document.createElement("li");addInline(li,bullet[1]);list.appendChild(li);
   }else{
     list=null;const p=document.createElement("p");addInline(p,line);bubble.appendChild(p);
   }
 }
}
function addMessage(role,text,links=[]){
 const wrap=document.createElement("div");wrap.className="neirai-message "+role;
 const label=document.createElement("span");label.className="neirai-message-label";label.textContent=role==="user"?"You":"NeirAI ✦";wrap.appendChild(label);
 const bubble=document.createElement("div");bubble.className="neirai-bubble";
 if(role==="assistant")renderAnswer(text,bubble);else{const p=document.createElement("p");p.textContent=String(text);bubble.appendChild(p)}
 if(links.length){const box=document.createElement("div");box.className="neirai-links";links.forEach(([label,url])=>{const a=document.createElement("a");a.href=url;a.textContent=label+" ↗";box.appendChild(a)});bubble.appendChild(box)}
 wrap.appendChild(bubble);conversation.appendChild(wrap);
 if(role==="assistant")requestAnimationFrame(()=>wrap.scrollIntoView({behavior:"smooth",block:"start"}));else conversation.scrollTop=conversation.scrollHeight;
}

function showFollowups(items=[]){
 followups.innerHTML="";
 if(!items.length){followups.hidden=true;return}
 const label=document.createElement("span");label.textContent="You might also ask";followups.appendChild(label);
 const track=document.createElement("div");track.className="neirai-followup-track";followups.appendChild(track);
 items.forEach(q=>{const b=document.createElement("button");b.type="button";b.textContent=q;b.title=q;b.onclick=()=>ask(q);track.appendChild(b)});
 followups.hidden=false;
 requestAnimationFrame(()=>{followups.scrollLeft=0});
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
   const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q,history:chatHistory.slice(-8)})});
   if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"NeirAI is temporarily unavailable.")}
   if(!response.body)throw new Error("Streaming is unavailable.");
   const wrap=document.createElement("div");wrap.className="neirai-message assistant";
   const label=document.createElement("span");label.className="neirai-message-label";label.textContent="NeirAI ✦";wrap.appendChild(label);
   const bubble=document.createElement("div");bubble.className="neirai-bubble";wrap.appendChild(bubble);
   conversation.appendChild(wrap);
   const reader=response.body.getReader(),decoder=new TextDecoder();
   let buffer="",answer="",suggestions=[],started=false,unsupported=false;
   while(true){
     const {value,done}=await reader.read();if(done)break;
     buffer+=decoder.decode(value,{stream:true});
     const lines=buffer.split("\n");buffer=lines.pop()||"";
     for(const line of lines){
       if(!line.trim())continue;
       const event=JSON.parse(line);
       if(event.type==="delta"){
         if(!started){typing.remove();started=true;requestAnimationFrame(()=>wrap.scrollIntoView({behavior:"smooth",block:"start"}))}
         answer+=event.delta;
         bubble.innerHTML="";renderAnswer(answer,bubble);
         conversation.scrollTop=conversation.scrollHeight;
       }else if(event.type==="unsupported"){
         unsupported=true;
         if(!started){typing.remove();started=true}
         bubble.innerHTML="";renderAnswer(event.message||"We don’t have information on that from Neira’s current sources yet.",bubble);
         const actions=document.createElement("div");actions.className="neirai-links";
         const feedback=document.createElement("a");feedback.href="mailto:neiraibrahimovic01@gmail.com?subject=NeirAI%20feedback&body="+encodeURIComponent("I asked NeirAI: "+q+"\n\nIt did not have information on this yet.");feedback.textContent="Send feedback so Neira can add it ↗";actions.appendChild(feedback);bubble.appendChild(actions);
       }else if(event.type==="done"){suggestions=event.followups||[]}
       else if(event.type==="error")throw new Error(event.error);
     }
   }
   if(!started)typing.remove();
   if(!unsupported&&answer.trim()){chatHistory.push({role:"user",content:q},{role:"assistant",content:answer.trim()});if(chatHistory.length>8)chatHistory.splice(0,chatHistory.length-8)}
   showFollowups(unsupported?[]:(suggestions.length?suggestions:followupsFor(q)));
   if(!unsupported&&wrap)requestAnimationFrame(()=>wrap.scrollIntoView({behavior:"smooth",block:"nearest"}));
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
