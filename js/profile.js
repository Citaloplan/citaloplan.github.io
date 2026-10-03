
const studentId = CitaloAuth.requireStudent();
if (studentId) {
  const student = CITALOPLAN_STUDENTS[studentId];
  if (!student) {
    CitaloAuth.logout();
  } else {
    document.title = `پروفایل ${student.name} | سیتالوپلن`;
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('riasecCode').textContent = student.code;
    document.getElementById('studentCore').textContent = student.core;
    document.getElementById('studentCore2').textContent = student.compassEnergy || student.core;
    document.getElementById('studentDecision').textContent = student.decision;
    document.getElementById('studentValues').textContent = student.values;

    const badges = [
      `RIASEC: ${student.code}`,
      'تمرکز: واقعیت روزمره رشته',
      'ارزش‌ها: استقلال + درآمد + اثرگذاری'
    ];
    document.getElementById('heroBadges').innerHTML = badges.map(x => `<span>${x}</span>`).join('');
    document.getElementById('focusList').innerHTML = (student.focus || []).map(x => `<span>${x}</span>`).join('');

    const poster = student.poster;
    document.getElementById('posterImage').src = poster;
    document.getElementById('posterLarge').src = poster;
    document.getElementById('downloadPoster').href = poster;

    const byId = Object.fromEntries(CITALOPLAN_MAJORS.map(m => [m.id, m]));
    document.getElementById('majorGrid').innerHTML = student.shortlist.map(id => {
      const m = byId[id];
      if (!m) return '';
      return `
        <article class="major-card">
          <div class="major-meta">
            <span>${m.degree}</span>
            <span>${m.duration}</span>
          </div>
          <h3>${m.name}</h3>
          <p>${m.tagline}</p>
          <a class="major-open" href="major.html?student=${encodeURIComponent(studentId)}&major=${encodeURIComponent(m.id)}">
            بررسی بیشتر
          </a>
        </article>
      `;
    }).join('');

    const modal = document.getElementById('posterModal');
    document.getElementById('openPoster').onclick = () => {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');
    };
    document.getElementById('closePoster').onclick = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
    };
    modal.onclick = (e) => {
      if (e.target === modal) document.getElementById('closePoster').click();
    };
    document.getElementById('logoutBtn').onclick = () => CitaloAuth.logout();
  }
}
