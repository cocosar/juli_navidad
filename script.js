document.addEventListener('DOMContentLoaded', () => {
    let appData = typeof APP_DATA !== 'undefined' ? APP_DATA : null;
    let currentGalleryItems = [];
    let currentImageIndex = 0;

    // --- Inicialización de la App ---
    function initApp() {
        if (!appData) {
            console.error('No se encontraron los datos de la aplicación (APP_DATA).');
            return;
        }

        // Configurar títulos y textos básicos
        document.title = `Para ${appData.config.nickname}`;
        
        // Surprise Mode
        const surpriseOverlay = document.getElementById('surprise-overlay');
        const mainContent = document.getElementById('main-content');
        
        if (appData.config.surpriseMode) {
            document.getElementById('surprise-title').textContent = appData.surprise.title;
            document.getElementById('surprise-message').textContent = appData.surprise.message;
            document.getElementById('surprise-btn').textContent = appData.surprise.buttonText;
            
            document.getElementById('surprise-btn').addEventListener('click', () => {
                surpriseOverlay.style.opacity = '0';
                setTimeout(() => {
                    surpriseOverlay.classList.add('hidden');
                    mainContent.classList.remove('hidden');
                    setupScrollAnimations();
                }, 800);
            });
        } else {
            surpriseOverlay.classList.add('hidden');
            mainContent.classList.remove('hidden');
            setupScrollAnimations();
        }

        // Renderizar secciones
        renderHero();
        renderTimeline();
        renderGallery('all');
        renderMessages();
        renderPlaylist();
        renderFooter();
        
        // Inicializar Tema
        initTheme();
    }

    // --- Renderizado de Secciones ---

    function renderHero() {
        document.getElementById('hero-title').textContent = appData.hero.title;
        document.getElementById('hero-subtitle').textContent = appData.hero.subtitle;
        document.getElementById('hero-description').textContent = appData.hero.description;
        document.getElementById('featured-photo').src = appData.hero.featuredPhoto;
        document.getElementById('featured-photo').alt = appData.hero.subtitle;
    }

    function renderTimeline() {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = appData.history.map(item => `
            <div class="timeline-item">
                <div class="timeline-date">${item.date}</div>
                <h3 class="timeline-title">${item.title}</h3>
                <p>${item.description}</p>
            </div>
        `).join('');
    }

    function renderGallery(filter = 'all') {
        const grid = document.getElementById('gallery-grid');
        currentGalleryItems = filter === 'all' 
            ? appData.gallery 
            : appData.gallery.filter(item => item.category === filter);

        grid.innerHTML = currentGalleryItems.map((item, index) => `
            <div class="gallery-item" data-index="${index}">
                <img src="${item.src}" alt="${item.alt}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x400?text=Foto+Proximamente'">
            </div>
        `).join('');

        // Listeners para el Lightbox
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                openLightbox(parseInt(item.dataset.index));
            });
        });
    }

    function renderMessages() {
        const grid = document.getElementById('messages-grid');
        grid.innerHTML = appData.messages.map(msg => `
            <div class="message-card">
                <p class="message-text">"${msg.text}"</p>
                <p class="message-date">${msg.date}</p>
            </div>
        `).join('');
    }

    function renderPlaylist() {
        const container = document.getElementById('spotify-container');
        // Detectar si es playlist o track para ajustar altura
        const isPlaylist = appData.playlist.embedUrl.includes('/playlist/');
        const height = isPlaylist ? 380 : 152;
        container.innerHTML = `
            <iframe style="border-radius:12px" src="${appData.playlist.embedUrl}" width="100%" height="${height}" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        `;
    }

    function renderFooter() {
        document.getElementById('footer-phrase').textContent = appData.footer.phrase;
        document.getElementById('footer-year').textContent = appData.footer.year;
    }

    // --- Filtros de Galería ---
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderGallery(btn.dataset.category);
        });
    });

    // --- Lightbox Logic ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    
    function openLightbox(index) {
        currentImageIndex = index;
        updateLightboxImage();
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Bloquear scroll
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
    }

    function updateLightboxImage() {
        const item = currentGalleryItems[currentImageIndex];
        lightboxImg.src = item.src;
        lightboxImg.alt = item.alt;
    }

    document.querySelector('.close-lightbox').addEventListener('click', closeLightbox);
    document.querySelector('.lightbox-prev').addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length;
        updateLightboxImage();
    });
    document.querySelector('.lightbox-next').addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % currentGalleryItems.length;
        updateLightboxImage();
    });

    // Cerrar con ESC o click afuera
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight' && lightbox.classList.contains('active')) document.querySelector('.lightbox-next').click();
        if (e.key === 'ArrowLeft' && lightbox.classList.contains('active')) document.querySelector('.lightbox-prev').click();
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // --- Tema Claro/Oscuro ---
    function initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(currentTheme);
        });
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    // --- Animaciones de Scroll ---
    function setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }

    // Iniciar app
    initApp();
});
