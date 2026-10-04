const quizModal = document.getElementById('quizModal');
const quizClose = document.getElementById('quizClose');
const quizContent = document.getElementById('quizContent');
const quizProgress = document.getElementById('quizProgress');
const quizStepLabel = document.getElementById('quizStepLabel');
const startButtons = document.querySelectorAll('[data-start-quiz]');
const leadTemplate = document.getElementById('leadFormTemplate');

const GOOGLE_SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz_BzY5SGa4OMEuVgqR7ddD8wNCITUXM6tLTuGOR_ZGDdjGgVeMf4-xMESCx9hHO7hW/exec';
const quizState = { step: 0, answers: {} };

const questions = [
  {
    key: 'concern',
    title: 'الان چه چیزی بیشتر ذهنت را درگیر کرده؟',
    subtitle: 'اگر فقط یکی را انتخاب کنی، کدام بیشتر ذهنت را درگیر کرده؟',
    type: 'choice',
    options: [
      'رشته‌ای را انتخاب کنم و بعداً پشیمان شوم.',
      'رشته‌ای را دوست داشته باشم ولی بازار کار خوبی نداشته باشد.',
      'انتخابم با سبک زندگی‌ای که می‌خواهم سازگار نباشد.',
      'بعداً برای مهاجرت یا تغییر مسیر محدود شوم.',
      'تحت تأثیر خانواده یا اطرافیان تصمیم نامناسبی بگیرم.',
      'با رتبه‌ام انتخاب‌های اشتباهی انجام دهم.',
      'هنوز دقیق نمی‌دانم.'
    ]
  },
  {
    key: 'helpNeeded',
    title: 'اگر قرار باشد فعلاً فقط در یک بخش به تو کمک کنیم، به کدام‌یک بیشتر احتیاج داری؟',
    subtitle: 'همان چیزی را انتخاب کن که اگر روشن‌تر شود، تصمیم‌گیری برایت راحت‌تر می‌شود.',
    type: 'choice',
    options: [
      'بفهمم چه رشته‌هایی بیشتر به من می‌آیند.',
      'بین چند گزینه‌ای که دارم مقایسه کنم.',
      'واقعیت رشته‌ها و شغل‌های مرتبط را بهتر بشناسم.',
      'بفهمم با رتبه‌ام کجاها شانس قبولی دارم.',
      'درباره بازار کار، درآمد و آینده رشته‌ها بدانم.',
      'مسیر مهاجرت هر رشته را بررسی کنم.',
      'بتوانم با خانواده درباره انتخابم منطقی‌تر صحبت کنم.',
      'یک نفر کل شرایط من را ببیند و کمکم کند تصمیم نهایی بگیرم.'
    ]
  },
  {
    key: 'paths',
    title: 'الان بیشتر به چه رشته‌ها یا مسیرهایی فکر می‌کنی؟',
    subtitle: 'اگر هنوز مطمئن نیستی هم می‌توانی همین را بنویسی.',
    type: 'text',
    placeholder: 'مثلاً داروسازی، علوم کامپیوتر یا هنوز مطمئن نیستم...'
  }
];

const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
function toFaNumber(value) {
  return String(value).replace(/\d/g, d => persianDigits[d]);
}
function faToEnDigits(value) {
  return String(value)
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

function track(eventName, payload = {}) {
  const event = { eventName, payload, ts: new Date().toISOString() };
  const old = JSON.parse(localStorage.getItem('citaloplan_events') || '[]');
  old.push(event);
  localStorage.setItem('citaloplan_events', JSON.stringify(old.slice(-150)));
  console.log('[CitaloPlan Event]', event);
}

function openQuiz() {
  quizState.step = 0;
  quizState.answers = {};
  quizModal.classList.add('open');
  quizModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  track('quiz_started');
  renderQuestion();
}
function closeQuiz() {
  quizModal.classList.remove('open');
  quizModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  track('quiz_closed', { step: quizState.step + 1 });
}
startButtons.forEach(btn => btn.addEventListener('click', openQuiz));
quizClose.addEventListener('click', closeQuiz);
quizModal.addEventListener('click', e => { if (e.target === quizModal) closeQuiz(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && quizModal.classList.contains('open')) closeQuiz(); });

function renderQuestion() {
  const q = questions[quizState.step];
  quizStepLabel.textContent = `مرحله ${toFaNumber(quizState.step + 1)} از ${toFaNumber(questions.length)}`;
  quizProgress.style.width = `${((quizState.step + 1) / questions.length) * 100}%`;

  const answerArea = q.type === 'text'
    ? `<div class="quiz-text-wrap"><input class="quiz-text-answer" type="text" autocomplete="off" placeholder="${escapeHtml(q.placeholder)}" /></div>`
    : `<div class="answer-grid">${q.options.map(option => `<button class="answer-btn" type="button" data-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}</div>`;

  quizContent.innerHTML = `
    <div class="quiz-page">
      <span class="mini-badge">شروع انتخاب آگاهانه</span>
      <h2 id="quizTitle">${q.title}</h2>
      <p>${q.subtitle}</p>
      ${answerArea}
      <button class="primary-btn quiz-next" type="button" disabled>ادامه</button>
    </div>
  `;

  const nextBtn = quizContent.querySelector('.quiz-next');
  let selected = '';

  if (q.type === 'text') {
    const input = quizContent.querySelector('.quiz-text-answer');
    input.addEventListener('input', () => {
      selected = input.value.trim();
      nextBtn.disabled = !selected;
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && selected) nextBtn.click();
    });
    setTimeout(() => input.focus(), 50);
  } else {
    const answerButtons = quizContent.querySelectorAll('.answer-btn');
    answerButtons.forEach(btn => btn.addEventListener('click', () => {
      answerButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selected = btn.dataset.answer;
      nextBtn.disabled = false;
    }));
  }

  nextBtn.addEventListener('click', () => {
    if (!selected) return;
    quizState.answers[q.key] = selected;
    track('quiz_answered', { step: quizState.step + 1, key: q.key, answer: selected });
    if (quizState.step < questions.length - 1) {
      quizState.step += 1;
      renderQuestion();
    } else {
      track('quiz_completed', { answers: quizState.answers });
      renderLeadGate();
    }
  });
}

function renderLeadGate() {
  quizStepLabel.textContent = 'نتیجه آماده است';
  quizProgress.style.width = '100%';
  quizContent.innerHTML = '';
  const node = leadTemplate.content.cloneNode(true);
  quizContent.appendChild(node);

  const form = quizContent.querySelector('#leadForm');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const mobileRaw = (formData.get('mobile') || '').toString().trim();
    const mobile = faToEnDigits(mobileRaw).replace(/[\s-]/g, '');
    if (!/^09\d{9}$/.test(mobile)) {
      alert('لطفاً شماره موبایل را به شکل ۰۹۱۲۱۲۳۴۵۶۷ وارد کن.');
      return;
    }

    const payload = new URLSearchParams();
    payload.set('name', (formData.get('name') || '').toString().trim());
    payload.set('mobile', mobile);
    payload.set('grade', (formData.get('grade') || '').toString().trim());
    payload.set('concern', quizState.answers.concern || '');
    payload.set('helpNeeded', quizState.answers.helpNeeded || '');
    payload.set('paths', quizState.answers.paths || '');
    payload.set('consent', formData.get('consent') === 'true' ? 'true' : 'false');

    const localLead = Object.fromEntries(payload.entries());
    localStorage.setItem('citaloplan_last_lead', JSON.stringify(localLead));
    track('lead_submitted', { grade: localLead.grade, concern: localLead.concern, helpNeeded: localLead.helpNeeded });

    submitBtn.disabled = true;
    submitBtn.textContent = 'نتیجه آماده است...';

    // UX-first: نتیجه را بلافاصله نمایش بده و ثبت Google Sheet را
    // در پس‌زمینه انجام بده تا کندی Apps Script کاربر را معطل نکند.
    renderResult();

    if (location.protocol !== 'file:') {
      fetch(GOOGLE_SHEET_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload.toString()
      }).catch((err) => {
        // اطلاعات همچنان در localStorage ذخیره شده است؛
        // شکست شبکه نباید تجربه نتیجه را متوقف کند.
        console.error('Google Sheet background submission error:', err);
      });
    }
  });
}

const concernInsights = {
  'رشته‌ای را انتخاب کنم و بعداً پشیمان شوم.': 'برای تو فقط انتخاب یک رشته مهم نیست؛ می‌خواهی مطمئن شوی تصویری که امروز از آن داری با واقعیت چند سال بعد فاصله زیادی ندارد. کمکت می‌کنیم انتظارت از رشته را با واقعیت تحصیل، کار و سبک زندگی آن کنار هم ببینی تا ریسک پشیمانی کمتر شود.',
  'رشته‌ای را دوست داشته باشم ولی بازار کار خوبی نداشته باشد.': 'علاقه برای تو مهم است، اما می‌خواهی بدانی این علاقه در آینده می‌تواند به یک مسیر شغلی قابل اتکا تبدیل شود یا نه. کمکت می‌کنیم علاقه را کنار بازار کار، فرصت رشد، درآمد و انعطاف مسیر قرار بدهی تا تصمیم فقط بر پایه جذابیت امروز نباشد.',
  'انتخابم با سبک زندگی‌ای که می‌خواهم سازگار نباشد.': 'برای تو فقط «چه شغلی داشته باشم؟» مطرح نیست؛ «چطور زندگی کنم؟» هم بخش مهم تصمیم است. کنارتیم تا ساعت و محیط کار، فشار شغلی، انعطاف زمانی و سبک زندگی واقعی مسیرها را وارد تصمیم کنیم.',
  'بعداً برای مهاجرت یا تغییر مسیر محدود شوم.': 'باز ماندن انتخاب‌های آینده برای تو اهمیت دارد. کمکت می‌کنیم مسیرها را فقط از نظر امروز نبینی و امکان ادامه تحصیل، مهاجرت، تغییر حوزه و مهارت‌های قابل‌انتقال هر مسیر را هم بررسی کنی.',
  'تحت تأثیر خانواده یا اطرافیان تصمیم نامناسبی بگیرم.': 'بخشی از سختی تصمیم تو، جدا کردن معیارهای خودت از نظر اطرافیان است. کنارتیم تا دلایل و معیارهای انتخابت روشن‌تر شوند و بتوانی تصمیمی بگیری که هم قابل دفاع باشد و هم بیشتر با خودت سازگار باشد.',
  'با رتبه‌ام انتخاب‌های اشتباهی انجام دهم.': 'برای تو فقط پیدا کردن رشته مناسب کافی نیست؛ باید انتخاب‌ها با رتبه و شرایطت هم واقع‌بینانه باشند. کمکت می‌کنیم محدوده انتخاب‌های خوش‌بینانه، منطقی و مطمئن را روشن‌تر کنی و بعد کیفیت خود گزینه‌ها را بسنجی.',
  'هنوز دقیق نمی‌دانم.': 'اینکه هنوز یک نگرانی مشخص برایت روشن نیست خودش اطلاعات مهمی است. کمکت می‌کنیم مشخص کنیم ابهامت بیشتر از شناخت خودت می‌آید، شناخت رشته‌ها یا محدودیت انتخاب‌ها تا مسئله تصمیم برایت قابل‌مدیریت‌تر شود.'
};

const nextStepSuggestions = {
  'بفهمم چه رشته‌هایی بیشتر به من می‌آیند.': 'قدم بعدی این است که علایق، توانمندی‌ها، ارزش‌ها و سبک کاری مطلوبت را دقیق‌تر بررسی کنیم و از دل آن‌ها چند مسیر ارزشمند برای بررسی عمیق‌تر پیدا کنیم. قرار نیست صرفاً یک اسم رشته به تو بدهیم؛ کمک می‌کنیم منطق پشت گزینه‌هایت را بفهمی.',
  'بین چند گزینه‌ای که دارم مقایسه کنم.': 'کنارتیم تا معیارهای مهم برای تو را کنار اطلاعات واقعی هر مسیر بگذاریم و ببینیم هر انتخاب چه فرصت‌ها، محدودیت‌ها و هزینه‌هایی دارد؛ تا مقایسه از «کدام رشته بهتر است؟» به «کدام مسیر برای من مناسب‌تر است؟» تبدیل شود.',
  'واقعیت رشته‌ها و شغل‌های مرتبط را بهتر بشناسم.': 'کمکت می‌کنیم تصویری که از رشته‌ها داری با واقعیت تحصیل، تجربه دانشجوها و فارغ‌التحصیل‌ها و شرایط واقعی کار تطبیق داده شود تا فاصله «تصور» و «واقعیت» قبل از انتخاب روشن شود.',
  'بفهمم با رتبه‌ام کجاها شانس قبولی دارم.': 'کمکت می‌کنیم رتبه، منطقه، سهمیه و داده‌های قبولی را کنار هم بگذاریم تا محدوده انتخاب‌های واقع‌بینانه‌ات روشن شود؛ بعد در همان محدوده سراغ مقایسه کیفیت گزینه‌ها می‌رویم.',
  'درباره بازار کار، درآمد و آینده رشته‌ها بدانم.': 'کنارتیم تا مسیر ورود به بازار کار، فرصت‌های شغلی، درآمد، امکان رشد و ریسک‌های آینده گزینه‌ها را با داده و واقعیت بازار مقایسه کنیم؛ نه فقط با شنیده‌ها و برداشت‌های عمومی.',
  'مسیر مهاجرت هر رشته را بررسی کنم.': 'کمکت می‌کنیم برای هر مسیر قابلیت انتقال مدرک، ادامه تحصیل، ورود به بازار کار خارج از ایران و محدودیت‌های احتمالی مهاجرت را جداگانه بررسی کنی تا آینده بین‌المللی انتخابت روشن‌تر شود.',
  'بتوانم با خانواده درباره انتخابم منطقی‌تر صحبت کنم.': 'کنارتیم تا معیارها، اطلاعات و دلایل انتخابت را شفاف کنیم و گفت‌وگو با خانواده از «من این را دوست دارم» و «ما فکر می‌کنیم آن بهتر است» به یک گفت‌وگوی مبتنی بر شواهد و معیارهای روشن تبدیل شود.',
  'یک نفر کل شرایط من را ببیند و کمکم کند تصمیم نهایی بگیرم.': 'قدم بعدی این است که تصویر کامل‌تری از خودت، گزینه‌ها، محدودیت‌ها و آینده احتمالی مسیرها کنار هم قرار بگیرد. کمکت می‌کنیم این اطلاعات پراکنده را به یک تصمیم چندمعیاره و قابل‌دفاع تبدیل کنی.'
};

function renderResult() {
  const concern = quizState.answers.concern || '';
  const helpNeeded = quizState.answers.helpNeeded || '';
  const insight = concernInsights[concern] || 'کمکت می‌کنیم مسئله اصلی تصمیم را روشن‌تر کنیم تا بدانی دقیقاً کدام بخش نیاز به بررسی عمیق‌تر دارد.';
  const nextStep = nextStepSuggestions[helpNeeded] || 'کنارتیم تا قدم بعدی را براساس شرایط و معیارهای خودت مشخص کنیم و مسیر را مرحله‌به‌مرحله جلو ببریم.';

  quizContent.innerHTML = `
    <div class="quiz-page result-box decision-map-result">
      <span class="mini-badge">نقشه اولیه تصمیم تو</span>
      <h2>پیشنهاد ما برای قدم بعدی تو</h2>
      <div class="decision-result-card">
        <span>چیزی که الان باید روشن‌تر شود</span>
        <p>${escapeHtml(insight)}</p>
      </div>
      <div class="decision-result-card decision-result-next">
        <span>قدم بعدی پیشنهادی ما</span>
        <p>${escapeHtml(nextStep)}</p>
      </div>
      <p class="result-note"><strong>این فقط یک تصویر اولیه از وضعیت فعلی تصمیم توست.</strong><br>برای بررسی دقیق‌تر شرایطت، به‌زودی با تو تماس می‌گیریم.</p>
      <button class="primary-btn" type="button" id="closeResultBtn">متوجه شدم</button>
    </div>
  `;
  document.getElementById('closeResultBtn').addEventListener('click', closeQuiz);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}


// Sequential chat reveal — replays every time the user scrolls away and back.
(function setupStudentChatRevealReplay() {
  const chat = document.querySelector('.student-chat');
  if (!chat) return;

  const rows = Array.from(chat.querySelectorAll('.chat-row'));
  const typing = chat.querySelector('.chat-typing');
  let timers = [];
  let isPlaying = false;

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function resetMessages() {
    clearTimers();
    isPlaying = false;

    if (typing) typing.classList.remove('is-active');

    rows.forEach(row => {
      row.classList.remove('is-visible');
      row.classList.add('chat-waiting');
    });
  }

  function revealMessages() {
    if (isPlaying) return;
    isPlaying = true;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      rows.forEach(row => row.classList.add('is-visible'));
      return;
    }

    rows.forEach((row, index) => {
      const typingStart = index * 900;
      const messageTime = typingStart + 430;

      timers.push(setTimeout(() => {
        if (typing) typing.classList.add('is-active');
      }, typingStart));

      timers.push(setTimeout(() => {
        if (typing) typing.classList.remove('is-active');
        row.classList.add('is-visible');
      }, messageTime));
    });

    timers.push(setTimeout(() => {
      isPlaying = false;
    }, rows.length * 900 + 600));
  }

  resetMessages();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.20) {
        revealMessages();
      } else if (!entry.isIntersecting || entry.intersectionRatio < 0.05) {
        resetMessages();
      }
    });
  }, {
    threshold: [0, 0.05, 0.20]
  });

  observer.observe(chat);

  window.addEventListener('beforeunload', clearTimers);
})();


// Animated statistics — count up when the experience section enters the viewport.
(function setupStatsCounter() {
  const counters = Array.from(document.querySelectorAll('.count-up'));
  if (!counters.length) return;

  const toPersianDigits = (value) =>
    String(value).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

  const animateCounter = (el) => {
    const target = Number(el.dataset.target || 0);
    const prefix = el.dataset.prefix || '';
    const duration = 1300;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = prefix + toPersianDigits(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = prefix + toPersianDigits(target);
      }
    }

    requestAnimationFrame(frame);
  };

  let hasAnimated = false;
  const statsSection = document.querySelector('#results') || document.querySelector('.results-section') || document.querySelector('.stats-grid');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        counters.forEach((counter, index) => {
          setTimeout(() => animateCounter(counter), index * 120);
        });
        obs.disconnect();
      }
    });
  }, { threshold: 0.18 });

  if (statsSection) observer.observe(statsSection);
})();


// Mobile navigation — compact sticky header + accessible hamburger menu.
(function setupMobileNavigation(){
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.mobile-menu-toggle');
  const panel = document.getElementById('mobileMenu');
  if (!header || !toggle || !panel) return;

  function setOpen(open){
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
    panel.setAttribute('aria-hidden', String(!open));
  }

  toggle.addEventListener('click', () => setOpen(!header.classList.contains('menu-open')));
  panel.querySelectorAll('a, button').forEach(el => el.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setOpen(false); });
})();
