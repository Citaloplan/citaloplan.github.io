
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
function roleRealityHTML(m){
  const r=m.roleReality; if(!r) return '';
  return `<section class="card role-reality"><h3>این رشته دقیقاً چه مسئله‌ای را حل می‌کند؟</h3><p class="role-problem">${esc(r.problem)}</p><div class="role-grid"><div><h4>خروجی‌های واقعی کار</h4>${list(r.outputs)}</div><div><h4>شغل‌های شروع مسیر</h4>${list(r.firstJobs)}</div></div><div class="reality-callout"><b>واقعیت مهم:</b> ${esc(r.reality)}</div></section>`;
}
function curriculumHTML(m){
  const c=m.curriculum; if(!c) return '';
  const groups=(c.groups||[]).map(g=>`<details class="course-group"><summary>${esc(g.title)}</summary><div class="course-full-list">${(g.courses||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div></details>`).join('');
  const imgs=(c.images||[]).map((src,i)=>`<a class="curriculum-page" href="${esc(src)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(src)}" alt="بخش ${i+1} چارت رسمی ${esc(m.name)}"><span>بخش ${i+1} • مشاهده بزرگ</span></a>`).join('');
  const pdf=c.pdf?`<a class="source-action" href="${esc(c.pdf)}" target="_blank" rel="noopener">مشاهده برنامه درسی کامل</a>`:'';
  return `<section class="card curriculum-card"><div class="curriculum-head"><div><h3>${esc(c.heading||'تمام دروس مصوب؛ بدون خلاصه‌سازی')}</h3><h4>${esc(c.title)}</h4><p class="curriculum-meta">${esc(c.meta||'')}</p></div><div class="source-actions">${pdf}</div></div>${c.note?`<div class="curriculum-note">${esc(c.note)}</div>`:''}${groups}${imgs?`<details class="official-pages" open><summary>جدول‌های کامل برنامه درسی (${(c.images||[]).length} بخش)</summary><div class="curriculum-gallery">${imgs}</div></details>`:''}</section>`;
}
function salaryReportsHTML(m){
  if(!(m.salaryReports||[]).length) return '';
  return `<section class="card salary-evidence"><h3>گزارش حقوق ۱۴۰۵</h3><div class="salary-report-grid">${m.salaryReports.map(r=>`<figure><a href="${esc(r.image)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(r.image)}" alt="${esc(r.title)}"></a><figcaption><strong>${esc(r.title)}</strong></figcaption></figure>`).join('')}</div></section>`;
}
const GRAD_HIGHLIGHTS = {
  industrialeng:['سیستم‌های تولید و خدمات','مدل‌سازی سیستم‌ها و تحلیل داده‌ها','روش‌های بهینه‌سازی','سیستم‌های سلامت','مدیریت نوآوری و فناوری','سیستم‌های مالی','لجستیک و زنجیره تأمین','مدیریت پروژه','کیفیت و بهره‌وری','سیستم‌های اطلاعاتی'],
  architecture:['مهندسی معماری','معماری پایدار','فناوری معماری','معماری داخلی','مطالعات معماری ایران','مرمت و احیای بناها و بافت‌های تاریخی','بازسازی پس از سانحه','معماری و نور'],
  electrical:['مدارهای مجتمع الکترونیک','سیستم‌های انرژی الکتریکی','الکترونیک قدرت و ماشین‌های الکتریکی','مخابرات','کنترل','سیستم‌های دیجیتال','بیوالکتریک','مکاترونیک','رباتیک','مهندسی عصبی-شناختی'],
  mechanical:['مکانیک جامدات','دینامیک، کنترل و ارتعاشات','تبدیل انرژی و سامانه‌های انرژی','ساخت و تولید','بیومکانیک','مکاترونیک','رباتیک','مهندسی خودرو','محاسبات مهندسی','مهندسی ورزش'],
  biomedical:['بیوالکتریک','بیومکانیک','بیومتریال','مهندسی بافت','مهندسی اطلاعات پزشکی','رایانش تصاویر پزشکی','مهندسی عصبی-شناختی','هوش مصنوعی در پزشکی'],
  engineeringscience:['بهینه‌سازی و سیستم‌ها','علم داده و محاسبات','سیستم‌های پیچیده','برق و کنترل','مکانیک و انرژی','مهندسی کامپیوتر','مهندسی عمران','مهندسی مواد','مهندسی شیمی'],
  economics:['اقتصاد نظری','اقتصاد مالی','اقتصاد انرژی','اقتصاد دیجیتال','توسعه اقتصادی و برنامه‌ریزی','اقتصاد محیط‌زیست','اقتصاد شهری','اقتصاد و تجارت الکترونیک'],
  financial:['مدیریت مالی','مهندسی مالی و مدیریت ریسک','بانکداری','بیمه','فناوری مالی','تأمین مالی و سرمایه‌گذاری'],
  industrial:['تحقیق در عملیات','تولید و عملیات','مدیریت عملکرد','مدیریت زنجیره تأمین','مدیریت کیفیت و بهره‌وری','مدیریت پروژه']
};
function gradHTML(m){
  let items = GRAD_HIGHLIGHTS[m.id] || (m.gradItems||[]);
  if(!items.length && (m.gradGroups||[]).length){
    items = m.gradGroups.flatMap(g=>g.items||[]).map(x=>String(x).replace(/^.*?—\s*/,''));
  }
  items=[...new Set(items)].slice(0,10);
  if(!items.length) return m.grad?`<p class="grad-path-text">${esc(m.grad)}</p>`:'';
  return `<div class="grad-section-label">مسیرها و گرایش‌هایی که می‌توان در ادامه بررسی کرد</div><div class="grad-chips">${items.map(x=>`<span class="grad-chip">${esc(x)}</span>`).join('')}</div>`;
}

function realVoiceHTML(id){
  const v=realVoices[id];
  if(!v) return ``;
  const bullet=(arr)=>`<ul class="clean">${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  return `<section class="card real-voice">
    <h3>از دل رشته</h3>
    <div class="voice-grid">
      <div class="voice-card daily"><h4>روزمره‌ای که از بیرون دیده نمی‌شود</h4>${bullet(v.daily)}</div>
      <div class="voice-card good"><h4>چیزهایی که دانشجوها دوست داشتند</h4>${bullet(v.good)}</div>
      <div class="voice-card hard"><h4>چیزهایی که بهتر است قبل از انتخاب بدانی</h4>${bullet(v.hard)}</div>
    </div>
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
  const salary = (m.salaries||[]).length?m.salaries.map(salaryHTML).join(''):`<div class="notice">برای این رشته در دو گزارش ارسالی، گروه شغلی مستقیمی که بتوان با اطمینان به خود رشته نسبت داد پیدا نشد؛ بنابراین عددسازی نکرده‌ایم.</div>`;
  const courseHTML=(ex.courses||[]).map(c=>`<span class="course-chip">${esc(c)}</span>`).join('');
  const scoreHTML=wl.score?`<span class="score-inline">${esc(wl.score)}</span>`:'';

  document.getElementById('content').innerHTML=`
  <section class="hero"><div class="eyebrow">پرونده واقعیت رشته • شخصی‌سازی‌شده برای ${esc(student.name)}</div><h2>${esc(m.name)}</h2><p>${esc(m.tagline)}</p><div class="quick"><span class="chip">${esc(m.degree)}</span><span class="chip">${esc(m.duration)}</span><span class="chip">${esc(m.contact)}</span><span class="chip">${esc(m.practical)}</span><span class="chip">${esc(m.pressure)}</span><span class="chip">${esc(m.independence)}</span></div></section>

  <section class="card profile-lens"><h3>لنز شخصی ${esc(student.name)} برای خواندن این رشته</h3>
  <div class="profile-row"><span class="profile-pill">RIASEC: ${esc(student.code)}</span><span class="profile-pill">${esc(student.scores)}</span><span class="profile-pill">تمرکز تصمیم: ${esc((student.focus||[]).join(" + "))}</span></div>
  <p>${esc(student.core)}</p><p>${esc(student.decision)}</p><p class="subtle">${esc(student.values)}</p></section>

  <section class="card accent-brick"><h3>رشته در ۶۰ ثانیه</h3><p>${esc(m.intro)}</p></section>

  ${roleRealityHTML(m)}

  <div class="grid2">
    <section class="card accent-yellow"><h3>در دانشگاه چه می‌گذرد؟</h3><p>${esc(m.university)}</p>
    <div class="detail-block"><span class="mini-title">جزئی‌تر:</span><p>${esc(ex.university)}</p><div class="course-chips">${courseHTML}</div></div></section>
    <section class="card accent-green"><h3>یک روز واقعی از این کار</h3><p>${esc(m.day)}</p>
    <div class="detail-block"><span class="mini-title">آن چیزی که معمولاً در معرفی‌های کوتاه گفته نمی‌شود:</span><p>${esc(ex.work)}</p></div></section>
  </div>

  ${curriculumHTML(m)}

  <section class="card"><h3>مهارت‌هایی که تعیین‌کننده‌اند:</h3>${list(m.skills)}</section>

  <div class="grid2"><section class="card fitbox"><h3>احتمالاً برایت دلچسب است اگر...</h3>${list(m.fit)}</section><section class="card watchbox"><h3>قبل از انتخاب جدی‌تر فکر کن اگر...</h3>${list(m.watch)}</section></div>

  <section class="card accent-purple"><h3>مسیرهای شغلی و واقعیت بازار ایران</h3><div class="paths">${m.paths.map(p=>`<span class="path">${esc(p)}</span>`).join('')}</div><p style="margin-top:14px">${esc(m.market)}</p><div class="deep-note">${esc(ex.market_extra)}</div></section>

  <section class="card"><h3>درآمد</h3>${salary}</section>

  ${salaryReportsHTML(m)}

  <section class="card worklife"><h3>رضایت شغلی، فشار کاری و سبک زندگی — به زبان ساده</h3>
  <p class="worklife-intro">این سه موضوع را جدا می‌کنیم، چون ممکن است یک شغل درآمد یا اعتبار خوبی داشته باشد اما سبک زندگی‌اش با تو جور نباشد؛ یا برعکس، فشارش متوسط باشد ولی از ماهیت کارش انرژی بگیری.</p>
  <div class="worklife-grid">
    <div class="life-card sat"><h4>💜 رضایت شغلی</h4><div class="life-value">${scoreHTML}${esc(wl.sat_label)}</div><p>${esc(wl.sat)}</p></div>
    <div class="life-card press"><h4>🧱 فشار کاری</h4><div class="life-value">${esc(wl.pressure_label)}</div><p>${esc(wl.pressure)}</p></div>
    <div class="life-card style"><h4>🌿 سبک زندگی</h4><div class="life-value">${esc(wl.style_label)}</div><p>${esc(wl.style)}</p></div>
  </div></section>

  <section class="card"><h3>تصور رایج در برابر واقعیت</h3><div class="myth"><div class="m"><b>تصور رایج</b>${esc(m.myth[0])}</div><div class="r"><b>واقعیت</b>${esc(m.myth[1])}</div></div></section>

  <section class="card ai"><h3>آینده رشته و AI</h3><p>${esc(m.ai)}</p></section>

  <div class="grid2"><section class="card grad-card"><h3>ادامه تحصیل</h3>${gradHTML(m)}</section><section class="card"><h3>مهاجرت کاری/تحصیلی</h3><p>${esc(m.migration)}</p></section></div>

  ${realVoiceHTML(m.id)}

    <section class="card shortlist"><h3>این رشته برای ${esc(student.name)}: دقیقاً کجایش می‌تواند جذاب یا اصطکاک‌زا باشد؟</h3>
  <div class="personal-grid">
    <div class="personal-box why"><h4>چرا ممکن است جذاب باشد؟</h4>${list(sf.why)}</div>
    <div class="personal-box friction"><h4>کجا ممکن است اذیتت کند؟</h4>${list(sf.friction)}</div>
    <div class="personal-box check"><h4>سؤال بررسی واقعیت مخصوص تو</h4><p>${esc(sf.question)}</p></div>
  </div></section>
  `;

  window.scrollTo({top:0,behavior:'smooth'});
}

const nav=document.getElementById('nav');
const select=document.getElementById('mobileSelect');
const byIdNav=Object.fromEntries(majors.map(m=>[m.id,m]));
const visibleMajors=(student.shortlist||majors.map(m=>m.id)).map(id=>byIdNav[id]).filter(Boolean);
function addBtn(m){const b=document.createElement('button');b.className='major-btn';b.dataset.id=m.id;b.textContent=m.name;b.onclick=()=>render(m);nav.appendChild(b);}
if(student.shortlistGroups?.length){student.shortlistGroups.forEach(g=>{const lab=document.createElement('div');lab.className='nav-group-label';lab.textContent=g.title;nav.appendChild(lab);const og=document.createElement('optgroup');og.label=g.title;(g.ids||[]).map(id=>byIdNav[id]).filter(Boolean).forEach(m=>{addBtn(m);const o=document.createElement('option');o.value=m.id;o.textContent=m.name;og.appendChild(o);});select.appendChild(og);});} else {visibleMajors.forEach(m=>{addBtn(m);const o=document.createElement('option');o.value=m.id;o.textContent=m.name;select.appendChild(o);});}
select.onchange=()=>render(visibleMajors.find(m=>m.id===select.value));

const requestedMajor = params.get('major');
const initial = visibleMajors.find(m=>m.id===requestedMajor) || visibleMajors[0];
render(initial);
