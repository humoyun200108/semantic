// static/js/results.js faylining YAKUNIY TO'LIQ KODI
// Animatsion matn bloki va highlight logikasi bilan

document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: Natijalar sahifasi JS yuklandi.");

    // DOM elementlari
    const resultsContentArea = document.getElementById('results-content-area');
    const originalTextBlock = document.getElementById('original-text-block');
    const originalTextDisplay = document.getElementById('original-text-display');
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (!resultsContentArea) { console.error("Kritik xato: #results-content-area topilmadi!"); return; }
    if (!originalTextBlock || !originalTextDisplay) { console.warn("Original matn bloklari topilmadi."); }

    // tsParticles va Kursor sozlamalari
    setupTsParticles();
    setupCustomCursor(cursorDot, cursorOutline);

    // --- Natijalarni localStorage'dan olish ---
    try {
        const storedResults = localStorage.getItem('analysisResults');
        if (storedResults) {
            console.log("DEBUG: localStorage'dan ma'lumot olindi.");
            let results = null;
            try { results = JSON.parse(storedResults); console.log("DEBUG: JSON parse qilindi:", results); }
            catch (parseError) { console.error("DEBUG: JSON parse xatosi:", parseError); showError("Saqlangan natijalarni o'qishda xatolik.", resultsContentArea); return; }

            if (!results || typeof results !== 'object') { throw new Error("localStorage ma'lumoti yaroqsiz."); }

            // Natijalarni ko'rsatish
            displayAnalysisResults(results, resultsContentArea);
            // Original matnni ko'rsatish va interaktivlikni qo'shish
            if (originalTextBlock && originalTextDisplay && results.originalText) {
                displayOriginalText(results.originalText, originalTextDisplay);
                addHighlightListeners(); // Bu funksiya ichida matn saqlanadi
            } else { if(originalTextBlock) originalTextBlock.style.display = 'none'; }

        } else { showError("Tahlil natijalari topilmadi...", resultsContentArea); }
    } catch (error) { showError("Natijalarni ko'rsatishda xatolik...", resultsContentArea); }
});

/** tsParticlesni sozlaydi */
function setupTsParticles() {
    if (typeof tsParticles !== 'undefined') { tsParticles.load("tsparticles", { fullScreen: { enable: true, zIndex: -1 }, background: { opacity: 0 }, particles: { number: { value: 60, density: { enable: true, value_area: 800 } }, color: { value: ["#00aaff", "#ffffff", "#0077cc"] }, shape: { type: "circle" }, opacity: { value: { min: 0.1, max: 0.5 }, random: true, anim: { enable: true, speed: 0.8, opacity_min: 0.1, sync: false } }, size: { value: { min: 1, max: 3 }, random: true }, links: { enable: true, distance: 150, color: "random", opacity: 0.3, width: 1, warp: true }, move: { enable: true, speed: 1.2, direction: "none", random: true, straight: false, out_mode: "out", bounce: false } }, interactivity: { detect_on: "window", events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: false }, resize: true }, modes: { repulse: { distance: 80, duration: 0.4 } } }, detectRetina: true }); console.log("DEBUG: tsParticles yuklandi."); } else { console.error("tsParticles kutubxonasi topilmadi!"); }
}

/** Maxsus kursor animatsiyasini sozlaydi */
function setupCustomCursor(cursorDot, cursorOutline) {
    if (!cursorDot || !cursorOutline) { console.warn("Maxsus kursor elementlari topilmadi."); return; }
    setTimeout(() => { document.body.classList.add('cursor-ready'); }, 100);
    const interactiveElements = document.querySelectorAll('button, a, #ner-list li, #keywords-list li');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => { document.body.classList.add('cursor-interact'); });
        el.addEventListener('mouseleave', () => { document.body.classList.remove('cursor-interact'); });
    });
    window.addEventListener('mousemove', (e) => { if (!cursorDot || !cursorOutline) return; const posX = e.clientX; const posY = e.clientY; cursorDot.style.left = `${posX}px`; cursorDot.style.top = `${posY}px`; cursorOutline.animate({ left: `${posX}px`, top: `${posY}px` }, { duration: 300, fill: "forwards" }); });
    console.log("DEBUG: Maxsus kursor sozlandi.");
}

/** Tahlil natijalarini HTML elementlariga joylashtiradi */
function displayAnalysisResults(results, containerElement) {
    console.log("DEBUG: displayAnalysisResults chaqirildi.");
    containerElement.innerHTML = ''; // Tozalash

    // 1. Sentiment Blokini Chizish
    if (results.sentiment !== undefined && results.sentiment !== null) {
        const sentimentHtml = `<div class="sentiment-container"><p id="sentiment-result" class="sentiment-${String(results.sentiment).toLowerCase()}">${getSentimentText(results.sentiment)}</p><button id="explainSentimentBtn" class="explain-button" title="Nega bunday natija chiqqanini so'rash"><i class="fas fa-question-circle"></i> Tushuntirish</button></div><div id="sentimentExplanation" class="explanation-box"></div>`;
        const sentimentBlock = createResultBlock('Hissiyot Tahlili', getSentimentIcon(results.sentiment), sentimentHtml);
        containerElement.appendChild(sentimentBlock);
        const explainBtn = document.getElementById('explainSentimentBtn');
        if (explainBtn) { if (results.originalText) { explainBtn.addEventListener('click', () => explainSentiment(results.sentiment, results.originalText)); } else { console.warn("DEBUG: Sentiment tushuntirish uchun originalText topilmadi."); explainBtn.disabled = true; explainBtn.title = "..."; } }
    } else { containerElement.appendChild(createResultBlock('Hissiyot Tahlili', 'fa-question-circle', '<p>Aniqlanmadi</p>')); }

    // 2. NER Blokini Chizish
    const nerContent = (results.entities && Array.isArray(results.entities) && results.entities.length > 0) ? `<ul id="ner-list">${results.entities.map(e => `<li data-text="${escapeHtml(e.text || '')}">${e.text || '?'} <span class="entity-type ${(e.type || 'unknown').toLowerCase()}">${e.type || '?'}</span></li>`).join('')}</ul>` : '<p>Nomlangan obyektlar yoki tushunchalar topilmadi.</p>';
    const nerBlock = createResultBlock('Topilgan Obyektlar va Tushunchalar (NER)', 'fa-tags', nerContent);
    containerElement.appendChild(nerBlock);

    // 3. Keywords Blokini Chizish
    const keywordsContent = (results.keywords && Array.isArray(results.keywords) && results.keywords.length > 0) ? `<ul id="keywords-list">${results.keywords.map(k => `<li data-text="${escapeHtml(k)}">${k}</li>`).join('')}</ul>` : '<p>Kalit so\'zlar topilmadi.</p>';
    const keywordsBlock = createResultBlock('Kalit So\'zlar', 'fa-key', keywordsContent);
    containerElement.appendChild(keywordsBlock);

    // 4. Statistika Blokini Chizish
    if (results.stats && typeof results.stats === 'object') {
        const statsListHtml = `<ul class="stats-list"><li><i class="fas fa-text-height"></i> Belgilar soni: <span>${results.stats.char_count ?? 'N/A'}</span></li><li><i class="fas fa-grip-lines"></i> So'zlar soni: <span>${results.stats.word_count ?? 'N/A'}</span></li><li><i class="fas fa-paragraph"></i> Gaplar soni (taxminiy): <span>${results.stats.sentence_count ?? 'N/A'}</span></li><li><i class="fas fa-tags"></i> Topilgan obyektlar/tushunchalar: <span>${results.entities?.length ?? 0}</span></li><li><i class="fas fa-key"></i> Topilgan kalit so'zlar: <span>${results.keywords?.length ?? 0}</span></li></ul>`;
        const chartHtml = `<div class="chart-container"><canvas id="entityChart"></canvas></div>`;
        const statsBlock = createResultBlock('Matn Statistikasi', 'fa-calculator', statsListHtml + chartHtml);
        containerElement.appendChild(statsBlock);
        // Grafikni chizish
        if (results.stats.entity_counts && typeof results.stats.entity_counts === 'object' && Object.keys(results.stats.entity_counts).length > 0) { setTimeout(() => { renderEntityChart(results.stats.entity_counts); }, 300); }
        else { const chartContainer = document.getElementById('entityChart')?.parentElement; if(chartContainer) chartContainer.innerHTML = '<p><em>Obyekt turlari bo\'yicha grafik uchun ma\'lumot yo\'q.</em></p>'; }
    } else { containerElement.appendChild(createResultBlock('Matn Statistikasi', 'fa-calculator', '<p>Statistika ma\'lumotlari mavjud emas.</p>')); }

    // Bloklar uchun paydo bo'lish animatsiyasi
    const blocks = containerElement.querySelectorAll('.result-block');
    blocks.forEach((block, index) => { if (block.id !== 'original-text-block') { block.style.opacity = '0'; block.style.animation = `fadeInUp 0.6s ease-out forwards`; block.style.animationDelay = `${index * 0.15}s`; } });
}

/** Original matnni ko'rsatish */
function displayOriginalText(originalText, containerElement) {
    console.log("DEBUG: displayOriginalText chaqirildi.");
    if (originalText && containerElement) { containerElement.textContent = originalText; console.log("DEBUG: Original matn ko'rsatildi."); }
    else { containerElement.textContent = "Asl matn topilmadi."; console.error("DEBUG: Original matnni ko'rsatish uchun ma'lumot yetarli emas."); }
}

/** Interaktiv highlight uchun hodisa eshituvchilarni qo'shadi */
let originalTextContentForHighlight = ''; // Global o'zgaruvchi
function addHighlightListeners() {
    console.log("DEBUG: addHighlightListeners chaqirildi.");
    const textDisplayBlock = document.getElementById('original-text-block');
    const textDisplayContent = document.getElementById('original-text-display');
    const highlightItems = document.querySelectorAll('#ner-list li, #keywords-list li');
    // Blokni yashirish uchun list konteynerlarini topamiz
    const listContainerNER = document.getElementById('ner-block');
    const listContainerKeywords = document.getElementById('keywords-block');

    if (!textDisplayBlock || !textDisplayContent || highlightItems.length === 0 || (!listContainerNER && !listContainerKeywords)) {
        console.warn("DEBUG: Highlight listenerlarni qo'shish uchun elementlar topilmadi.");
        return;
    }
    // Original matnni saqlash
    originalTextContentForHighlight = textDisplayContent.textContent || '';
    if (!originalTextContentForHighlight) { console.error("DEBUG: Highlight uchun bo'sh original matn!"); return; }
    console.log("DEBUG: Highlight uchun original matn saqlandi.");

    console.log(`DEBUG: Highlight uchun ${highlightItems.length} ta elementga listener qo'shiladi.`);

    highlightItems.forEach(item => {
        item.removeEventListener('mouseenter', handleHighlightEnter); // Eskisini olib tashlash
        item.addEventListener('mouseenter', handleHighlightEnter); // Yangisini qo'shish
    });

    // Blokni yashirish uchun list konteynerlaridan chiqishni kuzatish
    const leaveHandler = () => handleHighlightLeaveGeneral(textDisplayBlock);
    if(listContainerNER) { listContainerNER.removeEventListener('mouseleave', leaveHandler); listContainerNER.addEventListener('mouseleave', leaveHandler); }
    if(listContainerKeywords) { listContainerKeywords.removeEventListener('mouseleave', leaveHandler); listContainerKeywords.addEventListener('mouseleave', leaveHandler); }
}

/** Sichqoncha element ustiga kelganda blokni ko'rsatadi va highlight qiladi */
function handleHighlightEnter(event) {
    const item = event.currentTarget;
    const textToHighlight = item.getAttribute('data-text');
    const textDisplayBlock = document.getElementById('original-text-block');
    console.log(`DEBUG: Mouse enter: '${textToHighlight}'`);

    if (textToHighlight && textDisplayBlock) {
        // 1. Blokni ko'rsatish (CSS transition ishga tushadi)
        console.log("DEBUG: Adding 'visible' class to #original-text-block");
        textDisplayBlock.classList.add('visible');
        // 2. Highlight qilish
        highlightTextInContainer(textToHighlight);
    } else {
        console.warn("DEBUG: handleHighlightEnter - textToHighlight yoki textDisplayBlock topilmadi.");
    }
}

/** Sichqoncha list konteyneridan chiqqanda blokni yashiradi va highlightni olib tashlaydi */
function handleHighlightLeaveGeneral(textDisplayBlock) {
    // Argument sifatida kelmasa, topib olamiz
    if (!textDisplayBlock) textDisplayBlock = document.getElementById('original-text-block');
    console.log("DEBUG: Mouse leave from list container");
    if (textDisplayBlock) {
        console.log("DEBUG: Removing 'visible' class from #original-text-block");
        textDisplayBlock.classList.remove('visible'); // Blokni yashirish
    }
    // Highlightni darhol olib tashlash
    removeHighlight();
}


/** Matn ichida berilgan so'zni <mark> bilan o'raydi (scrollsiz) */
function highlightTextInContainer(textToHighlight) {
    const container = document.getElementById('original-text-display');
    if (!textToHighlight || !container || !originalTextContentForHighlight) { console.warn("DEBUG: highlightTextInContainer - yetarli ma'lumot yo'q."); return; }
    console.log(`DEBUG: Highlighting '${textToHighlight}'`);

    try {
        const escapedText = textToHighlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedText})`, 'gi');
        // Original matnni ishlatib, <mark> qo'shish
        container.innerHTML = originalTextContentForHighlight.replace(regex, '<mark class="highlight">$1</mark>');
        // ScrollIntoView olib tashlandi!
    } catch (e) { console.error("DEBUG: Highlight qilishda RegExp xatosi:", e); removeHighlight(); }
}

/** Highlightni olib tashlab, original matnni tiklaydi */
function removeHighlight() {
     const container = document.getElementById('original-text-display');
     if (container && originalTextContentForHighlight) {
         // Faqat highlight mavjud bo'lsa tiklaymiz
         if (container.querySelector('mark.highlight')) {
             console.log("DEBUG: Removing highlight");
             container.textContent = originalTextContentForHighlight;
         }
     }
}

/** Natija bloki uchun HTML yaratadi */
function createResultBlock(title, iconClass, contentHtml) { const block = document.createElement('div'); block.classList.add('result-block', 'card'); if (title === 'Matn Statistikasi') block.id = 'stats-block'; if (title === 'Topilgan Obyektlar va Tushunchalar (NER)') block.id = 'ner-block'; if (title === 'Kalit So\'zlar') block.id = 'keywords-block'; if (title === 'Hissiyot Tahlili') block.id = 'sentiment-block'; block.innerHTML = `<h3><i class="fas ${iconClass}"></i> ${title}</h3><div class="result-content">${contentHtml}</div>`; return block; }

/** Sentiment nomini qaytaradi */
function getSentimentText(sentiment) { if (sentiment === null || sentiment === undefined) return 'Noma\'lum'; const sentimentLower = String(sentiment).toLowerCase(); if (sentimentLower === 'positive') return 'Ijobiy'; if (sentimentLower === 'negative') return 'Salbiy'; if (sentimentLower === 'neutral') return 'Neytral'; return String(sentiment); }

/** Sentiment ikonkasi klassini qaytaradi */
function getSentimentIcon(sentiment) { if (sentiment === null || sentiment === undefined) return 'fa-question-circle'; const sentimentLower = String(sentiment).toLowerCase(); if (sentimentLower === 'positive') return 'fa-smile-beam'; if (sentimentLower === 'negative') return 'fa-frown'; if (sentimentLower === 'neutral') return 'fa-meh'; return 'fa-question-circle'; }

/** Xatolik xabarini ko'rsatadi */
function showError(message, containerElement) { if (!containerElement) containerElement = document.getElementById('results-content-area'); containerElement.innerHTML = `<div class="error card">${message}</div>`; const errorElement = containerElement.querySelector('.error'); if (errorElement) { errorElement.style.opacity = '0'; errorElement.style.animation = `fadeInUp 0.6s ease-out forwards`; } }

/** Sentiment uchun AI tushuntirishini backenddan so'raydi va ko'rsatadi */
async function explainSentiment(sentiment, originalText) {
    const explanationBox = document.getElementById('sentimentExplanation');
    const explainBtn = document.getElementById('explainSentimentBtn');
    if (!explanationBox || !originalText || !explainBtn) { console.error("Tushuntirish elementlari topilmadi."); return; };

    explainBtn.disabled = true; explainBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> So'ralmoqda...`;
    explanationBox.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> AI tushuntirish tayyorlamoqda...</p>`;
    explanationBox.style.maxHeight = '100px'; explanationBox.classList.add('visible');

    try {
        console.log("DEBUG: /explain_sentiment ga so'rov yuborilmoqda...");
        const response = await fetch('/explain_sentiment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: originalText, sentiment: sentiment }) });
        const data = await response.json();
        console.log("DEBUG: /explain_sentiment dan javob:", data);
        if (!response.ok || data.error) { throw new Error(data.error || `Server ${response.status} xatosi qaytardi.`); }
        let formattedExplanation = data.explanation.replace(/\n/g, '<br>');
        explanationBox.innerHTML = `<p>${formattedExplanation}</p>`;
        setTimeout(() => { if (explanationBox.scrollHeight > 0) { explanationBox.style.maxHeight = explanationBox.scrollHeight + "px"; } else { explanationBox.style.maxHeight = '500px'; } }, 50);
    } catch (error) {
        console.error("Sentiment tushuntirishda xatolik:", error);
        explanationBox.innerHTML = `<p style="color: var(--error-color);">Tushuntirishni olishda xatolik yuz berdi: ${error.message}</p>`;
        explanationBox.style.maxHeight = explanationBox.scrollHeight + "px";
    } finally {
         explainBtn.style.display = 'none'; // Tugmani yashirish
         console.log("DEBUG: Tushuntirish tugmasi yashirildi.");
    }
}

/** Obyekt turlari taqsimoti uchun Chart.js grafigini chizadi */
function renderEntityChart(entityCounts) {
    const ctx = document.getElementById('entityChart')?.getContext('2d');
    if (!ctx) { console.error("Canvas elementi 'entityChart' topilmadi."); return; }
    if (typeof Chart === 'undefined') { console.error("Chart.js kutubxonasi topilmadi!"); return; }

    const labels = Object.keys(entityCounts);
    const data = Object.values(entityCounts);
    const backgroundColors = labels.map(label => { switch (label) { case 'PERSON': return 'rgba(37, 99, 235, 0.7)'; case 'LOCATION': return 'rgba(22, 163, 74, 0.7)'; case 'ORGANIZATION': return 'rgba(245, 158, 11, 0.7)'; case 'SOHA': return 'rgba(147, 51, 234, 0.7)'; case 'TUSHUNCHA': return 'rgba(20, 184, 166, 0.7)'; default: return 'rgba(108, 117, 125, 0.7)'; } });

    let existingChart = Chart.getChart(ctx); if (existingChart) { existingChart.destroy(); } // Eski chartni yo'q qilish

    new Chart(ctx, {
        type: 'doughnut', data: { labels: labels, datasets: [{ label: 'Obyekt Turlari Soni', data: data, backgroundColor: backgroundColors, borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, hoverOffset: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(229, 231, 235, 0.8)', padding: 15, font: { family: "'Poppins', sans-serif" } } }, title: { display: true, text: 'Topilgan Obyekt Turlarining Taqsimoti', color: 'rgba(229, 231, 235, 0.9)', padding: { top: 10, bottom: 20 }, font: { size: 16, family: "'Poppins', sans-serif" } } }, animation: { animateScale: true, animateRotate: true } }
    });
    console.log("DEBUG: Entity chart chizildi.");
}

/** HTML maxsus belgilaridan qochish uchun funksiya */
function escapeHtml(unsafe) { if (!unsafe) return ''; return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }

