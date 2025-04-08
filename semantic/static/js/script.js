// static/js/script.js faylining YANGILANGAN versiyasi (Original matnni localStorage'ga saqlaydi)

// --- DOM Elementlarini topib olish ---
const analyzeButton = document.getElementById('analyzeButton');
const textInput = document.getElementById('textInput');
const resultsArea = document.getElementById('resultsArea'); // Xatoliklar uchun
const loader = document.getElementById('loader');
// const placeholderMessage = document.getElementById('placeholder-message'); // Bosh sahifada endi placeholder yo'q
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

// --- tsParticles Konfiguratsiyasi ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof tsParticles !== 'undefined') {
         tsParticles.load("tsparticles", { /* ... tsParticles konfiguratsiyasi ... */
            fullScreen: { enable: true, zIndex: -1 },
            background: { opacity: 0 },
            particles: { number: { value: 80, density: { enable: true, value_area: 800 } }, color: { value: ["#00aaff", "#ffffff", "#0077cc"] }, shape: { type: "circle" }, opacity: { value: { min: 0.1, max: 0.6 }, random: true, anim: { enable: true, speed: 0.8, opacity_min: 0.1, sync: false } }, size: { value: { min: 1, max: 4 }, random: true }, links: { enable: true, distance: 140, color: "random", opacity: 0.4, width: 1, warp: true }, move: { enable: true, speed: 1.5, direction: "none", random: true, straight: false, out_mode: "out", bounce: false } }, interactivity: { detect_on: "window", events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true }, modes: { repulse: { distance: 80, duration: 0.4 }, push: { quantity: 3 } } }, detectRetina: true
         });
    } else {
        console.error("tsParticles kutubxonasi yuklanmadi!");
    }

    // Kursor va interaktiv elementlar sozlamalari
    setTimeout(() => { document.body.classList.add('cursor-ready'); }, 100);
    const interactiveElements = document.querySelectorAll('button, a, textarea, input');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => { document.body.classList.add('cursor-interact'); });
        el.addEventListener('mouseleave', () => { document.body.classList.remove('cursor-interact'); });
    });
});

// --- Kursor Animatsiyasi Logikasi ---
window.addEventListener('mousemove', (e) => {
    if (!cursorDot || !cursorOutline) return;
    const posX = e.clientX;
    const posY = e.clientY;
    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;
    cursorOutline.animate({ left: `${posX}px`, top: `${posY}px` }, { duration: 300, fill: "forwards" });
});

// --- Analiz Tugmasi Logikasi (localStorage'ga originalText'ni ham saqlaydi) ---
analyzeButton.addEventListener('click', async () => {
    const text = textInput.value; // Original matnni olamiz

    if (!text.trim()) {
        showMainPageError("Iltimos, tahlil qilish uchun matn kiriting.");
        return;
    }

    // --- Analiz Boshlandi ---
    if(resultsArea) resultsArea.innerHTML = '';
    // if (placeholderMessage) { placeholderMessage.style.display = 'block'; } // Placeholder yo'q
    loader.style.display = 'block';
    analyzeButton.disabled = true;
    analyzeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tahlil qilinmoqda...';

    try {
        // Backendga so'rov yuborish
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text }), // Faqat matnni yuboramiz
        });

        const results = await response.json(); // Tahlil natijasini (entities, sentiment, keywords) olamiz

        if (!response.ok || results.error) {
            showMainPageError(`Xatolik: ${results.error || `Server ${response.status} xatosi qaytardi.`}`);
            console.error("Server xatosi:", results);
             loader.style.display = 'none';
             analyzeButton.disabled = false;
             analyzeButton.innerHTML = '<i class="fas fa-cogs"></i> Tahlil Qilish';
        } else {
            // --- MUHIM O'ZGARISH: Natijaga original matnni qo'shib saqlash ---
            try {
                // Natijalar obyektiga original matnni qo'shamiz
                results.originalText = text;

                localStorage.setItem('analysisResults', JSON.stringify(results));
                console.log("Natijalar (matn bilan birga) localStorage'ga saqlandi.");
                // Natijalar sahifasiga yo'naltirish
                window.location.href = '/results';
            } catch (storageError) {
                console.error("localStorage'ga saqlashda xatolik:", storageError);
                showMainPageError("Natijalarni saqlashda xatolik yuz berdi. Brauzer sozlamalarini tekshiring.");
                 loader.style.display = 'none';
                 analyzeButton.disabled = false;
                 analyzeButton.innerHTML = '<i class="fas fa-cogs"></i> Tahlil Qilish';
            }
            // --- Yo'naltirish tugashi ---
        }

    } catch (error) {
        // Frontend xatosi
        console.error("Frontend Xatosi:", error);
        loader.style.display = 'none';
        analyzeButton.disabled = false;
        analyzeButton.innerHTML = '<i class="fas fa-cogs"></i> Tahlil Qilish';
        showMainPageError("Serverga ulanishda xatolik yuz berdi. Server ishlayotganini va internet aloqasini tekshiring.");
    }
});

// Bosh sahifada xatolik ko'rsatish uchun
function showMainPageError(message) {
    if (!resultsArea) {
         console.error("resultsArea topilmadi! Xato:", message);
         alert(message);
         return;
    }
    resultsArea.innerHTML = `<div class="error">${message}</div>`;
    // if (placeholderMessage) { placeholderMessage.style.display = 'none'; } // Placeholder yo'q
    resultsArea.classList.add('visible');
}

