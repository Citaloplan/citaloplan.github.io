const quizModal = document.getElementById('quizModal');
const quizClose = document.getElementById('quizClose');
const quizContent = document.getElementById('quizContent');
const quizProgress = document.getElementById('quizProgress');
const quizStepLabel = document.getElementById('quizStepLabel');
const startButtons = document.querySelectorAll('[data-start-quiz]');
const leadTemplate = document.getElementById('leadFormTemplate');

const quizState = { step: 0, answers: {} };

const questions = [
  {
    key: 'segment',
    title: 'اول بگو از کدام مسیر وارد شدی؟',
    subtitle: 'تا سؤال‌ها را متناسب‌تر جلو ببریم.',
    options: ['پایه نهم', 'پایه دوازدهم', 'والد']
  },
  {
    key: 'mainConcern',
    title: 'الان کدام نگرانی بیشتر ذهنت را درگیر کرده؟',
    subtitle: 'جواب درست و غلطی وجود ندارد.',
    options: ['انتخاب اشتباه و پشیمانی', 'قبول نشدن در گزینه دلخواه', 'آینده شغلی و درآمد', 'مهاجرت و امکان تغییر مسیر', 'فشار یا اختلاف نظر خانواده', 'هنوز دقیق نمی‌دانم']
  },
  {
    key: 'priority',
    title: 'اگر مجبور باشی فقط یکی را جلوتر بگذاری، کدام مهم‌تر است؟',
    subtitle: 'این سؤال کمک می‌کند معیار تصمیم تو را بهتر بفهمیم.',
    options: ['علاقه و رضایت شخصی', 'درآمد و امنیت شغلی', 'سبک زندگی و زمان آزاد', 'اعتبار و جایگاه اجتماعی', 'فرصت مهاجرت', 'انعطاف برای تغییر مسیر']
  },
  {
    key: 'certainty',
    title: 'الان چقدر درباره مسیرت مطمئنی؟',
    subtitle: 'حس فعلی خودت را انتخاب کن.',
    options: ['تقریباً تصمیمم را گرفته‌ام', 'بین ۲ یا ۳ گزینه مرددم', 'گزینه‌های زیادی دارم و گیجم', 'تقریباً هیچ تصویر روشنی ندارم']
  },
  {
    key: 'help',
    title: 'اگر بخواهیم فقط در یک بخش کمکت کنیم، کدام ارزشمندتر است؟',
    subtitle: 'این جواب مشخص می‌کند در ادامه روی چه چیزی تمرکز کنیم.',
    options: ['شناخت بهتر خودم', 'شناخت واقعیت رشته‌ها', 'مقایسه گزینه‌ها', 'بررسی قبولی با رتبه و شرایط من', 'ساختن گزینه‌های جایگزین', 'کاهش استرس و منظم کردن تصمیم']
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

  quizContent.innerHTML = `
    <div class="quiz-page">
      <span class="mini-badge">قطب‌نمای انتخاب</span>
      <h2 id="quizTitle">${q.title}</h2>
      <p>${q.subtitle}</p>
      <div class="answer-grid">
        ${q.options.map(option => `<button class="answer-btn" type="button" data-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}
      </div>
      <button class="primary-btn quiz-next" type="button" disabled>ادامه</button>
    </div>
  `;

  let selected = null;
  const answerButtons = quizContent.querySelectorAll('.answer-btn');
  const nextBtn = quizContent.querySelector('.quiz-next');
  answerButtons.forEach(btn => btn.addEventListener('click', () => {
    answerButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selected = btn.dataset.answer;
    nextBtn.disabled = false;
  }));
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
  const segmentField = quizContent.querySelector('#segmentField');
  const answersField = quizContent.querySelector('#quizAnswersField');
  const scoreField = quizContent.querySelector('#leadScoreField');

  if (quizState.answers.segment) segmentField.value = quizState.answers.segment;
  const leadScore = calculateLeadScore();
  answersField.value = JSON.stringify(quizState.answers);
  scoreField.value = leadScore;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const mobileRaw = (formData.get('mobile') || '').toString().trim();
    const mobile = faToEnDigits(mobileRaw).replace(/\s|-/g, '');
    if (!/^09\d{9}$/.test(mobile)) {
      alert('لطفاً شماره موبایل را به شکل ۰۹۱۲۱۲۳۴۵۶۷ وارد کن.');
      return;
    }
    formData.set('mobile', mobile);

    track('lead_submitted', { segment: formData.get('segment'), leadScore });
    const leadObject = Object.fromEntries(formData.entries());
    localStorage.setItem('citaloplan_last_lead', JSON.stringify(leadObject));

    if (location.protocol !== 'file:') {
      try {
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString()
        });
      } catch (err) {
        console.warn('Form submission fallback:', err);
      }
    }
    renderResult();
  });
}

function calculateLeadScore() {
  let score = 0;
  const a = quizState.answers;
  if (a.segment === 'پایه دوازدهم') score += 3;
  if (a.mainConcern === 'انتخاب اشتباه و پشیمانی') score += 2;
  if (a.mainConcern === 'قبول نشدن در گزینه دلخواه') score += 2;
  if (a.certainty === 'بین ۲ یا ۳ گزینه مرددم') score += 2;
  if (a.certainty === 'گزینه‌های زیادی دارم و گیجم') score += 3;
  if (a.certainty === 'تقریباً هیچ تصویر روشنی ندارم') score += 3;
  if (a.help === 'مقایسه گزینه‌ها' || a.help === 'بررسی قبولی با رتبه و شرایط من') score += 2;
  return score;
}

function renderResult() {
  const a = quizState.answers;
  const headline = a.priority || 'معیارهای شخصی تو';
  const need = a.help || 'شفاف‌تر کردن مسیر';
  const concern = a.mainConcern || 'ابهام در تصمیم';
  quizContent.innerHTML = `
    <div class="quiz-page result-box">
      <span class="mini-badge">نقشه اولیه تصمیم تو</span>
      <h2>الان تصمیم تو بیشتر حول این سه محور می‌چرخد:</h2>
      <div class="result-pill">اولویت اصلی: ${escapeHtml(headline)}</div>
      <div class="result-pill">دغدغه اصلی: ${escapeHtml(concern)}</div>
      <div class="result-pill">کمکی که بیشترین ارزش را دارد: ${escapeHtml(need)}</div>
      <p>این نتیجه تشخیص یا نسخه نهایی نیست؛ فقط یک نقطه شروع است تا بفهمیم در ادامه باید کجا را دقیق‌تر بررسی کنیم.</p>
      <div class="result-actions">
        <a href="#results" class="secondary-btn" id="seeResultsBtn">دیدن نتایج اخیر</a>
        <button class="primary-btn" type="button" id="consultBtn">درخواست مشاوره</button>
      </div>
    </div>
  `;
  document.getElementById('seeResultsBtn').addEventListener('click', () => {
    closeQuiz();
    track('results_from_quiz_clicked');
  });
  document.getElementById('consultBtn').addEventListener('click', () => {
    track('consultation_clicked');
    alert('در مرحله بعد این دکمه را به واتساپ یا فرم رزرو مشاوره وصل می‌کنیم.');
  });
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
