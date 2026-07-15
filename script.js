(function() {
  'use strict';

  // ---------- برگ چای (افکت) ----------
  function createTeaLeaves() {
    const leafEmojis = ['🌿', '🍃', '🌱', '☘️'];
    for (let i = 0; i < 14; i++) {
      const el = document.createElement('div');
      el.className = 'tea-leaf';
      el.textContent = leafEmojis[i % leafEmojis.length];
      el.style.left = Math.random() * 96 + 2 + '%';
      el.style.top = Math.random() * 96 + 2 + '%';
      el.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
      el.style.animationDuration = (14 + Math.random() * 20) + 's';
      el.style.animationDelay = (Math.random() * 10) + 's';
      el.style.opacity = 0.06 + Math.random() * 0.10;
      document.body.appendChild(el);
    }
  }
  createTeaLeaves();

  // ---------- ناوبری صفحات ----------
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('[data-page]');
  const mainNav = document.getElementById('mainNav');

  function showPage(pageId) {
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // بستن مگا منوها
    closeAllMegas();

    // بروزرسانی URL
    if (history.pushState) {
      const url = new URL(window.location);
      url.searchParams.set('page', pageId);
      history.pushState({ page: pageId }, '', url);
    }
  }

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const page = this.dataset.page;
      if (page) {
        e.preventDefault();
        showPage(page);
      }
    });
  });

  // مدیریت رویدادهای مگا منو (کلیک برای باز/بستن)
  const megaTriggers = document.querySelectorAll('.main-nav > li > a[data-page]');
  const megaDropdowns = document.querySelectorAll('.mega-dropdown');

  function closeAllMegas() {
    megaDropdowns.forEach(d => d.classList.remove('open'));
  }

  megaTriggers.forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      const page = this.dataset.page;
      const parent = this.closest('li').querySelector('.mega-dropdown');
      if (!parent) {
        e.preventDefault();
        showPage(page);
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      if (parent.classList.contains('open')) {
        parent.classList.remove('open');
        return;
      }

      closeAllMegas();
      parent.classList.add('open');
    });
  });

  // بستن با کلیک بیرون
  document.addEventListener('click', function(e) {
    const isInside = e.target.closest('.main-nav') || e.target.closest('.mega-dropdown');
    if (!isInside) {
      closeAllMegas();
    }
  });

  // بستن با Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeAllMegas();
    }
  });

  // ---------- هدر اسکرول ----------
  const header = document.getElementById('header');
  window.addEventListener('scroll', function() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // ---------- گالری (لایت‌باکس) ----------
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeLightbox = document.getElementById('closeLightbox');

  document.querySelectorAll('.gallery-preview img, .gallery-grid img').forEach(img => {
    img.addEventListener('click', function() {
      const src = this.dataset.full || this.src;
      lightboxImg.src = src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightboxFn() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  closeLightbox.addEventListener('click', closeLightboxFn);
  lightbox.addEventListener('click', function(e) {
    if (e.target === this) closeLightboxFn();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLightboxFn();
  });

  // ---------- رزرو (LocalStorage) ----------
  const bookingForm = document.getElementById('bookingForm');
  const reservationList = document.getElementById('reservationList');
  const toast = document.getElementById('toast');

  // پر کردن انتخاب اقامتگاه از دکمه‌های کارت
  document.querySelectorAll('.btn-book').forEach(btn => {
    btn.addEventListener('click', function() {
      const stayName = this.dataset.stay;
      const select = document.getElementById('selectedStay');
      if (select) {
        select.value = stayName;
      }
      document.getElementById('page-reservation').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // بارگذاری رزروها
  function loadReservations() {
    const data = JSON.parse(localStorage.getItem('reservations') || '[]');
    if (!reservationList) return;
    reservationList.innerHTML = '';
    if (data.length === 0) {
      reservationList.innerHTML = '<p style="color:var(--gray);">هیچ رزروی ثبت نشده است.</p>';
      return;
    }
    data.forEach((item, index) => {
      const div = document.createElement('div');
      div.style.cssText = 'background:white; border-radius:16px; padding:12px 16px; box-shadow:var(--shadow); border:1px solid #f0ebe4; flex:1 1 200px;';
      div.innerHTML = `
        <strong>${item.fullName}</strong><br>
        <span style="font-size:0.85rem; color:var(--gray);">${item.stay} • ${item.guests} نفر</span><br>
        <span style="font-size:0.8rem;">ورود: ${item.checkIn} | خروج: ${item.checkOut}</span>
        <button data-idx="${index}" style="background:none; border:none; color:#b91c1c; cursor:pointer; float:left; font-size:0.9rem;"><i class="fas fa-trash"></i></button>
      `;
      reservationList.appendChild(div);

      div.querySelector('button[data-idx]').addEventListener('click', function() {
        const idx = parseInt(this.dataset.idx);
        let list = JSON.parse(localStorage.getItem('reservations') || '[]');
        list.splice(idx, 1);
        localStorage.setItem('reservations', JSON.stringify(list));
        loadReservations();
        showToast('رزرو حذف شد');
      });
    });
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  bookingForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const guests = parseInt(document.getElementById('guests').value);
    const stay = document.getElementById('selectedStay').value;

    if (!fullName || !mobile || !checkIn || !checkOut || !guests) {
      showToast('لطفاً تمام فیلدهای اجباری را پر کنید.');
      return;
    }

    const newRes = { fullName, mobile, checkIn, checkOut, guests, stay };
    const list = JSON.parse(localStorage.getItem('reservations') || '[]');
    list.push(newRes);
    localStorage.setItem('reservations', JSON.stringify(list));

    showToast('رزرو شما با موفقیت ثبت شد!');
    bookingForm.reset();
    loadReservations();
  });

  // بارگذاری اولیه
  loadReservations();

  // ---------- بازیابی صفحه از URL ----------
  function restorePageFromURL() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page) {
      const target = document.getElementById('page-' + page);
      if (target) {
        pages.forEach(p => p.classList.remove('active'));
        target.classList.add('active');
      }
    } else {
      const home = document.getElementById('page-home');
      if (home) {
        pages.forEach(p => p.classList.remove('active'));
        home.classList.add('active');
      }
    }
  }
  restorePageFromURL();

  window.addEventListener('popstate', function(e) {
    if (e.state && e.state.page) {
      showPage(e.state.page);
    } else {
      restorePageFromURL();
    }
  });

  // ---------- به‌روزرسانی تاریخ امروز در فرم (پیش‌فرض) ----------
  const today = new Date().toISOString().split('T')[0];
  const checkInInput = document.getElementById('checkIn');
  const checkOutInput = document.getElementById('checkOut');
  if (checkInInput) checkInInput.min = today;
  if (checkOutInput) checkOutInput.min = today;
  if (checkInInput) checkInInput.value = today;
  if (checkOutInput) {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    checkOutInput.value = tomorrow;
  }

  console.log('وب‌سایت چای‌باغ با موفقیت بارگذاری شد.');
})();
