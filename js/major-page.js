
const sessionStudentId = CitaloAuth.requireStudent();
const params = new URLSearchParams(location.search);
const requestedStudentId = params.get('student') || sessionStudentId;
const studentId = sessionStudentId; // For demo security, session controls whose profile is visible.
const student = CITALOPLAN_STUDENTS[studentId];
const majors = CITALOPLAN_MAJORS;
const expanded = CITALOPLAN_EXPANDED;
const worklife = CITALOPLAN_WORKLIFE;
const realVoices = CITALOPLAN_REAL_VOICES;
const studentFit = CITALOPLAN_STUDENT_MAJOR_INSIGHTS[studentId] || {};

if (!student) {
  CitaloAuth.logout();
}

document.getElementById('pageSubtitle').textContent = `پرونده واقعیت رشته • شخصی‌سازی‌شده برای ${student.name}`;
document.getElementById('shortlistTitle').textContent = `لیست انتخابی ${student.name}`;

function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function salaryHTML(s){return `<div class="salary-source"><div class="salary-head"><strong>${esc(s.label)}</strong><small>${esc(s.note||'')}</small></div><div class="range"><span>${s.p25}</span><div class="line"></div><span class="median">${s.median}</span><div class="line"></div><span>${s.p75}</span></div><div class="range-labels"><span>چارک ۲۵٪</span><span>میانه</span><span>چارک ۷۵٪</span></div></div>`}
function list(arr){return `<ul class="clean">${(arr||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}
function gradHTML(m){
  const items=(m.gradItems||[]).map(x=>`<span class="grad-chip">${esc(x)}</span>`).join('');
  const note=m.gradNote?`<div class="grad-note">${esc(m.gradNote)}</div>`:'';
  return `
    <div class="grad-section-label">مسیرهای ادامه تحصیل</div>
    <p class="grad-path-text">${esc(m.grad)}</p>
    ${items?`
      <div class="grad-section-label grad-programs-label">رشته‌ها و گرایش‌های ارشد</div>
      <div class="grad-chips">${items}</div>
    `:''}
    ${note}
  `;
}

function realVoiceHTML(id){
  const v=realVoices[id];
  if(!v) return ``;
  const bullet=(arr)=>`<ul class="clean">${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  return `<section class="card real-voice">
    <h3>از دل رشته؛ تجربه واقعی دانشجویان و فارغ التحصیلان</h3>
    <p class="voice-intro">${esc(v.source_count)} — این بخش جمع‌بندیِ تجربه‌های ارسالی است؛ نه حکم قطعی درباره همه دانشگاه‌ها و همه شاغلان.</p>
    <div class="voice-grid">
      <div class="voice-card daily"><h4>روزمره‌ای که از بیرون دیده نمی‌شود</h4>${bullet(v.daily)}</div>
      <div class="voice-card good"><h4>چیزهایی که خودشان دوست داشتند</h4>${bullet(v.good)}</div>
      <div class="voice-card hard"><h4>چیزهایی که گفتند باید قبل از انتخاب بدانی</h4>${bullet(v.hard)}</div>
    </div>
    <div class="voice-note">${esc(v.note)}</div>
  </section>`;
}

function render(m){
  document.querySelectorAll('.major-btn').forEach(b=>b.classList.toggle('active',b.dataset.id===m.id));
  const select = document.getElementById('mobileSelect');
  if (select) select.value=m.id;

  history.replaceState(null,'',`major.html?student=${encodeURIComponent(studentId)}&major=${encodeURIComponent(m.id)}`);
  document.title = `${m.name} برای ${student.name} | سیتالوپلن`;

  const ex=expanded[m.id]||{courses:[],university:'',work:'',market_extra:''};
  const wl=worklife[m.id]||{score:null,sat_label:'',sat:'',pressure_label:'',pressure:'',style_label:'',style:''};
  const sf=studentFit[m.id]||{why:[],friction:[],question:''};
  const salary = m.salaries.length?m.salaries.map(salaryHTML).join(''):`<div class="notice">برای این رشته در دو گزارش ارسالی، گروه شغلی مستقیمی که بتوان با اطمینان به خود رشته نسبت داد پیدا نشد؛ بنابراین عددسازی نکرده‌ایم.</div>`;
  const courseHTML=(ex.courses||[]).map(c=>`<span class="course-chip">${esc(c)}</span>`).join('');
  const scoreHTML=wl.score?`<span class="score-inline">${esc(wl.score)}</span>`:'';

  document.getElementById('content').innerHTML=`
  <section class="hero"><div class="eyebrow">پرونده واقعیت رشته • شخصی‌سازی‌شده برای ${esc(student.name)}</div><h2>${esc(m.name)}</h2><p>${esc(m.tagline)}</p><div class="quick"><span class="chip">${esc(m.degree)}</span><span class="chip">${esc(m.duration)}</span><span class="chip">${esc(m.contact)}</span><span class="chip">${esc(m.practical)}</span><span class="chip">${esc(m.pressure)}</span><span class="chip">${esc(m.independence)}</span></div></section>

  <section class="card profile-lens"><h3>لنز شخصی ${esc(student.name)} برای خواندن این رشته</h3>
  <div class="profile-row"><span class="profile-pill">RIASEC: ${esc(student.code)}</span><span class="profile-pill">${esc(student.scores)}</span><span class="profile-pill">تمرکز تصمیم: واقعیت روزمره + استقلال + درآمد + اثرگذاری</span></div>
  <p>${esc(student.core)}</p><p>${esc(student.decision)}</p><p class="subtle">${esc(student.values)}</p></section>

  <div class="notice"><b>درآمد:</b> اعداد ۱۴۰۵ در JobVision و IranTalent عمدتاً «حقوق درخواستی/مورد انتظار» هستند، نه پرداخت قطعی ۱۴۰۵. هرجا گروه شغلی دقیقاً معادل این رشته نباشد، به‌عنوان benchmark نزدیک توضیح داده شده است.</div>

  <section class="card accent-brick"><h3>رشته در ۶۰ ثانیه</h3><p>${esc(m.intro)}</p></section>

  <div class="grid2">
    <section class="card accent-yellow"><h3>در دانشگاه چه می‌گذرد؟</h3><p>${esc(m.university)}</p>
    <div class="detail-block"><span class="mini-title">جزئی‌تر:</span><p>${esc(ex.university)}</p><div class="course-chips">${courseHTML}</div></div></section>
    <section class="card accent-green"><h3>یک روز واقعی از این کار</h3><p>${esc(m.day)}</p>
    <div class="detail-block"><span class="mini-title">آن چیزی که معمولاً در معرفی‌های کوتاه گفته نمی‌شود:</span><p>${esc(ex.work)}</p></div></section>
  </div>

  <section class="card"><h3>مهارت‌هایی که تعیین‌کننده‌اند:</h3>${list(m.skills)}</section>

  <div class="grid2"><section class="card fitbox"><h3>احتمالاً برایت دلچسب است اگر...</h3>${list(m.fit)}</section><section class="card watchbox"><h3>قبل از انتخاب جدی‌تر فکر کن اگر...</h3>${list(m.watch)}</section></div>

  <section class="card accent-purple"><h3>مسیرهای شغلی و واقعیت بازار ایران</h3><div class="paths">${m.paths.map(p=>`<span class="path">${esc(p)}</span>`).join('')}</div><p style="margin-top:14px">${esc(m.market)}</p><div class="deep-note">${esc(ex.market_extra)}</div></section>

  <section class="card"><h3>درآمد</h3>${salary}</section>

  <section class="card worklife"><h3>رضایت شغلی، فشار کاری و سبک زندگی — به زبان ساده</h3>
  <p class="worklife-intro">این سه موضوع را جدا می‌کنیم، چون ممکن است یک شغل درآمد یا اعتبار خوبی داشته باشد اما سبک زندگی‌اش با تو جور نباشد؛ یا برعکس، فشارش متوسط باشد ولی از ماهیت کارش انرژی بگیری.</p>
  <div class="worklife-grid">
    <div class="life-card sat"><h4>💜 رضایت شغلی</h4><div class="life-value">${scoreHTML}${esc(wl.sat_label)}</div><p>${esc(wl.sat)}</p></div>
    <div class="life-card press"><h4>🧱 فشار کاری</h4><div class="life-value">${esc(wl.pressure_label)}</div><p>${esc(wl.pressure)}</p></div>
    <div class="life-card style"><h4>🌿 سبک زندگی</h4><div class="life-value">${esc(wl.style_label)}</div><p>${esc(wl.style)}</p></div>
  </div></section>

  <section class="card"><h3>Expectation vs Reality</h3><div class="myth"><div class="m"><b>تصور رایج</b>${esc(m.myth[0])}</div><div class="r"><b>واقعیت</b>${esc(m.myth[1])}</div></div></section>

  <section class="card ai"><h3>آینده رشته و AI</h3><p>${esc(m.ai)}</p></section>

  <div class="grid2"><section class="card grad-card"><h3>ادامه تحصیل</h3>${gradHTML(m)}</section><section class="card"><h3>مهاجرت کاری/تحصیلی</h3><p>${esc(m.migration)}</p></section></div>

  ${realVoiceHTML(m.id)}

  <section class="card shortlist"><h3>این رشته برای ${esc(student.name)}: دقیقاً کجایش می‌تواند جذاب یا اصطکاک‌زا باشد؟</h3>
  <div class="personal-grid">
    <div class="personal-box why"><h4>چرا ممکن است جذاب باشد؟</h4>${list(sf.why)}</div>
    <div class="personal-box friction"><h4>کجا ممکن است اذیتت کند؟</h4>${list(sf.friction)}</div>
    <div class="personal-box check"><h4>سؤال Reality Check مخصوص تو</h4><p>${esc(sf.question)}</p></div>
  </div></section>
  `;

  window.scrollTo({top:0,behavior:'smooth'});
}

const nav=document.getElementById('nav');
const select=document.getElementById('mobileSelect');
const shortlistSet = new Set(student.shortlist || majors.map(m=>m.id));
const visibleMajors = majors.filter(m=>shortlistSet.has(m.id));

visibleMajors.forEach(m=>{
  const b=document.createElement('button');
  b.className='major-btn';
  b.dataset.id=m.id;
  b.textContent=m.name;
  b.onclick=()=>render(m);
  nav.appendChild(b);

  const o=document.createElement('option');
  o.value=m.id;
  o.textContent=m.name;
  select.appendChild(o);
});

select.onchange=()=>render(visibleMajors.find(m=>m.id===select.value));

const requestedMajor = params.get('major');
const initial = visibleMajors.find(m=>m.id===requestedMajor) || visibleMajors[0];
render(initial);
