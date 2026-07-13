const SUPABASE_URL = 'https://mqdrqkucadkypyiglgic.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_03gzca8SwmtCTs84YerXrw_nCUprvU8';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function showToast(msg, type = 'info') {
    const container = $('#toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
menuToggle?.addEventListener('click', () => { mainNav.classList.toggle('open'); });
$$('nav a').forEach(link => link.addEventListener('click', () => mainNav?.classList.remove('open')));

const currentPage = document.body.dataset.page;
$$('nav a').forEach(a => { if (a.dataset.nav === currentPage) a.classList.add('active'); });

const galleryGrid = $('#galleryGrid');

if (galleryGrid) {
    async function loadGallery() {
        galleryGrid.innerHTML = `<p style="color: var(--muted); grid-column: 1 / -1;">در حال بارگذاری گالری...</p>`;
        const { data, error } = await supabaseClient.from('gallery').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('خطا در بارگذاری گالری:', error);
            galleryGrid.innerHTML = `<p style="color: var(--danger); grid-column: 1 / -1;">مشکلی در بارگذاری گالری پیش آمد.</p>`;
            return;
        }
        galleryGrid.innerHTML = '';
        if (!data || data.length === 0) {
            galleryGrid.innerHTML = `<p style="color: var(--muted); grid-column: 1 / -1;">هنوز تصویری اضافه نشده است.</p>`;
            return;
        }
        data.forEach((item, i) => {
            const img = document.createElement('img');
            img.src = item.image_url;
            img.alt = item.caption || `منظره طبیعی چای‌باغ ${i + 1}`;
            img.loading = 'lazy';
            galleryGrid.appendChild(img);
        });
    }

    const lightbox = $('#lightbox');
    const lightboxImg = $('#lightboxImg');
    const lightboxClose = $('#lightboxClose');

    galleryGrid.addEventListener('click', (e) => {
        const img = e.target.closest('img');
        if (!img) return;
        lightboxImg.src = img.src;
        lightbox.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    function closeLightbox() {
        lightbox.classList.remove('show');
        document.body.style.overflow = '';
    }

    lightboxClose?.addEventListener('click', closeLightbox);
    lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
        if (!lightbox.classList.contains('show')) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const imgs = $$('#galleryGrid img');
            const currentSrc = lightboxImg.src;
            let idx = imgs.findIndex(img => img.src === currentSrc);
            if (idx === -1) return;
            idx = e.key === 'ArrowRight' ? (idx + 1) % imgs.length : (idx - 1 + imgs.length) % imgs.length;
            lightboxImg.src = imgs[idx].src;
        }
    });

    loadGallery();
}

const stayGrid = $('#stayGrid');
let LODGINGS = [];

if (stayGrid) {
    async function loadLodgings() {
        stayGrid.innerHTML = `<p style="color: rgba(255,255,255,0.75);">در حال بارگذاری اقامتگاه‌ها...</p>`;
        const { data, error } = await supabaseClient.from('lodgings').select('*').order('created_at', { ascending: true });
        if (error) {
            console.error('خطا در بارگذاری اقامتگاه‌ها:', error);
            stayGrid.innerHTML = `<p style="color: var(--danger);">مشکلی در بارگذاری اقامتگاه‌ها پیش آمد.</p>`;
            return;
        }
        LODGINGS = data || [];
        stayGrid.innerHTML = '';
        if (LODGINGS.length === 0) {
            stayGrid.innerHTML = `<p style="color: rgba(255,255,255,0.75);">در حال حاضر اقامتگاهی ثبت نشده است.</p>`;
            return;
        }
        LODGINGS.forEach(stay => {
            const price = Number(stay.price_per_night).toLocaleString('fa-IR');
            const card = document.createElement('div');
            card.className = 'stay-card';
            card.innerHTML = `
                <img src="${stay.image_url}" alt="${stay.name}" class="stay-card-img" loading="lazy">
                <div class="stay-card-body">
                    <h3>${stay.name}</h3>
                    <p style="color: rgba(255,255,255,0.7); font-size: 13.5px; margin-bottom: 12px;">${stay.description || ''}</p>
                    <div class="stay-meta"><span><i class="fas fa-users"></i> ${stay.capacity} نفر</span></div>
                    <div class="stay-price">${price} <small>تومان / شب</small></div>
                    <button class="btn btn-accent book-stay-btn" data-id="${stay.id}" style="width: 100%; justify-content: center;">
                        <i class="fas fa-calendar-plus"></i> رزرو این اقامتگاه
                    </button>
                </div>
            `;
            stayGrid.appendChild(card);
        });
    }

    const form = $('#reservationForm');
    const modal = $('#reservationModal');
    const modalClose = $('#modalClose');
    const modalOkBtn = $('#modalOkBtn');
    const modalLoading = $('#modalLoading');
    const modalSuccess = $('#modalSuccess');
    const modalError = $('#modalError');
    const modalErrorText = $('#modalErrorText');

    function openModal() { modal.classList.add('show'); document.body.style.overflow = 'hidden'; }
    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        modalLoading.style.display = 'flex';
        modalSuccess.style.display = 'none';
        modalError.style.display = 'none';
    }

    modalClose?.addEventListener('click', closeModal);
    modalOkBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    function validatePhone(phone) { return /^09[0-9]{9}$/.test(phone.replace(/\s/g, '')); }

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = $('#fullName').value.trim();
        const phone = $('#phone').value.trim();
        const checkIn = $('#checkIn').value;
        const checkOut = $('#checkOut').value;
        const guests = $('#guests').value;
        const lodgingId = $('#selectedLodgingId').value || null;

        let valid = true;
        if (!name) { $('#nameError').style.display = 'block'; valid = false; } else { $('#nameError').style.display = 'none'; }
        if (!validatePhone(phone)) { $('#phoneError').style.display = 'block'; valid = false; } else { $('#phoneError').style.display = 'none'; }
        if (!checkIn || !checkOut) { showToast('لطفاً تاریخ ورود و خروج را انتخاب کنید.', 'error'); valid = false; }
        if (checkIn && checkOut && checkIn > checkOut) { showToast('تاریخ ورود نباید از تاریخ خروج بزرگ‌تر باشد.', 'error'); valid = false; }
        if (!valid) return;

        openModal();
        modalLoading.style.display = 'flex';
        modalSuccess.style.display = 'none';
        modalError.style.display = 'none';

        const { error } = await supabaseClient.from('bookings').insert([{
            lodging_id: lodgingId, full_name: name, phone: phone,
            check_in: checkIn, check_out: checkOut, guests_count: Number(guests)
        }]);

        modalLoading.style.display = 'none';

        if (!error) {
            modalSuccess.style.display = 'block';
            showToast('✅ درخواست رزرو با موفقیت ثبت شد!', 'success');
            form.reset();
            $('#selectedLodgingId').value = '';
        } else {
            console.error('خطا در ثبت رزرو:', error);
            modalErrorText.textContent = 'متأسفانه در ثبت درخواست خطایی رخ داد. لطفاً دوباره تلاش کنید.';
            modalError.style.display = 'block';
            showToast('❌ خطا در ثبت درخواست', 'error');
        }
    });

    stayGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.book-stay-btn');
        if (!btn) return;
        const stayId = btn.dataset.id;
        const stay = LODGINGS.find(s => String(s.id) === String(stayId));
        if (!stay) return;
        $('#selectedLodgingId').value = stay.id;
        $('#reservation')?.scrollIntoView({ behavior: 'smooth' });
        const msgField = $('#message');
        if (msgField) {
            msgField.value = `درخواست رزرو اقامتگاه "${stay.name}" - ظرفیت ${stay.capacity} نفر`;
            msgField.focus();
            showToast(`📝 اطلاعات اقامتگاه "${stay.name}" اضافه شد.`, 'info');
        }
    });

    loadLodgings();
}

const revealEls = $$('.reveal');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
revealEls.forEach(el => observer.observe(el));

window.addEventListener('load', () => {
    revealEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 60) el.classList.add('visible');
    });
});

console.log('🌿 روستای چای‌باغ - وب‌سایت با موفقیت بارگذاری شد!');
