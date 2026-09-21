document.getElementById("year").textContent=new Date().getFullYear();
document.querySelectorAll(".principle").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".principle").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("principle-copy").textContent=btn.dataset.copy;
}));
document.querySelectorAll(".story-toggle").forEach(btn=>btn.addEventListener("click",()=>{
  const panel=btn.nextElementSibling;
  const open=panel.classList.toggle("open");
  btn.setAttribute("aria-expanded",open);
  const s=btn.querySelector("span");
  if(s && (s.textContent==="+"||s.textContent==="−")) s.textContent=open?"−":"+";
}));
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));