// static/js/expert_results.js faylining YAKUNIY TO'LIQ KODI
// Bog'liqlik grafigi (soddalashtirilgan ko'rinish, eski fizika) va Sentiment Dinamikasi grafigi bilan

// Global o'zgaruvchilar
let relationshipNetwork = null;
let sentimentChart = null;
let originalTextContentForHighlight = ''; // Highlight uchun

document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG (Expert): DOM yuklandi.");

    // DOM elementlari
    const graphContainerDiv = document.getElementById('relationshipGraph');
    const graphLoader = graphContainerDiv?.querySelector('.graph-loader');
    const graphBlock = document.getElementById('relationship-graph-block');
    const expandBtn = document.getElementById('expand-graph-btn');
    const closeBtn = document.getElementById('close-graph-btn');
    const sentimentContainerDiv = document.getElementById('sentimentDynamicsChartContainer');
    const sentimentLoader = sentimentContainerDiv?.querySelector('.graph-loader');
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    // Elementlar mavjudligini tekshirish
    if (!graphContainerDiv || !graphBlock) { console.error("Kritik xato: Grafik uchun elementlar topilmadi."); return; }
    if (!sentimentContainerDiv) { console.warn("Sentiment dinamikasi konteyneri topilmadi."); }
    if (!expandBtn || !closeBtn) { console.warn("DEBUG (Expert): Kattalashtirish/kichiklashtirish tugmalari topilmadi."); }

    // Kursor va tsParticles
    setupCustomCursor(cursorDot, cursorOutline);
    setupTsParticlesExpert();

    // --- localStorage'dan ma'lumot olish ---
    console.log("DEBUG (Expert): localStorage'dan ma'lumot olinmoqda...");
    let analysisData = null;
    try {
        const storedResults = localStorage.getItem('analysisResults');
        if (storedResults) {
            analysisData = JSON.parse(storedResults);
            console.log("DEBUG (Expert): localStorage'dan ma'lumot olindi.");

            if (analysisData && analysisData.originalText) {
                // Bog'liqlik grafigini ishga tushirish
                fetchAndRenderRelationships(analysisData.originalText, graphContainerDiv, graphLoader);
                // Sentiment dinamikasini ishga tushirish
                fetchAndRenderSentimentDynamics(analysisData.originalText, sentimentContainerDiv, sentimentLoader);
                // Original matnni chiqarish (display:none bo'ladi) - Bu qator keraksiz edi, olib tashlandi
                // displayOriginalText(analysisData.originalText, document.getElementById('original-text-display'));
                // Interaktivlikni qo'shish - Bu ham results.js da edi, bu yerda kerak emas
                // addHighlightListeners();
            } else {
                showGraphError("Grafik uchun asl matn topilmadi.", graphContainerDiv, graphLoader);
                showErrorInContainer("Sentiment dinamikasi uchun asl matn topilmadi.", sentimentContainerDiv, sentimentLoader);
            }
            // Boshqa placeholderlar
            renderKeywordNetworkPlaceholder();
            renderTopicModelingPlaceholder();
        } else { /* ... localStorage xatosi ... */ showGraphError("Tahlil natijalari topilmadi.", graphContainerDiv, graphLoader); showErrorInContainer("Tahlil natijalari topilmadi.", sentimentContainerDiv, sentimentLoader); }
    } catch (error) { /* ... umumiy xatolik ... */ showGraphError("Natijalarni yuklashda xatolik.", graphContainerDiv, graphLoader); showErrorInContainer("Natijalarni yuklashda xatolik.", sentimentContainerDiv, sentimentLoader); }

    // --- Kattalashtirish/Kichiklashtirish Tugmalari ---
    if (expandBtn && closeBtn && graphBlock) {
        expandBtn.addEventListener('click', () => {
            console.log("DEBUG (Expert): Expand button bosildi.");
            graphBlock.classList.add('graph-fullscreen');
            expandBtn.style.display = 'none';
            closeBtn.style.display = 'inline-block';
            setTimeout(() => { if (relationshipNetwork) { try { relationshipNetwork.fit(); } catch (e) { console.error("Fit error (expand):", e); } } }, 100);
        });
        closeBtn.addEventListener('click', () => {
            console.log("DEBUG (Expert): Close button bosildi.");
            graphBlock.classList.remove('graph-fullscreen');
            closeBtn.style.display = 'none';
            expandBtn.style.display = 'inline-block';
             setTimeout(() => { if (relationshipNetwork) { try { relationshipNetwork.fit(); } catch (e) { console.error("Fit error (close):", e); } } }, 100);
        });
    }

}); // DOMContentLoaded tugashi


/** Ekspert sahifasi uchun tsParticles sozlamalari */
function setupTsParticlesExpert() {
    if (typeof tsParticles !== 'undefined') { tsParticles.load("tsparticles", { fullScreen: { enable: true, zIndex: -1 }, background: { opacity: 0 }, particles: { number: { value: 50, density: { enable: true, value_area: 900 } }, color: { value: ["#8b5cf6", "#14b8a6", "#f59e0b", "#ffffff"] }, shape: { type: "triangle" }, opacity: { value: { min: 0.2, max: 0.6 } }, size: { value: { min: 1, max: 4 } }, links: { enable: true, distance: 180, color: "#ffffff", opacity: 0.15, width: 1 }, move: { enable: true, speed: 1.8, direction: "none", random: true, straight: false, out_mode: "bounce", bounce: true } }, interactivity: { detect_on: "window", events: { onhover: { enable: true, mode: "bubble" }, onclick: { enable: true, mode: "repulse" }, resize: true }, modes: { bubble: { distance: 250, size: 6, duration: 0.4 }, push: { quantity: 2 }, repulse: { distance: 100 } } }, detectRetina: true }); console.log("DEBUG (Expert): tsParticles yuklandi."); } else { console.error("tsParticles kutubxonasi topilmadi!"); }
}

/** Maxsus kursor animatsiyasini sozlaydi */
function setupCustomCursor(cursorDot, cursorOutline) {
    if (!cursorDot || !cursorOutline) { console.warn("Maxsus kursor elementlari topilmadi."); return; }
    setTimeout(() => { document.body.classList.add('cursor-ready'); }, 100);
    const interactiveElements = document.querySelectorAll('button, a'); // Bu sahifadagi elementlar
    interactiveElements.forEach(el => { el.addEventListener('mouseenter', () => { document.body.classList.add('cursor-interact'); }); el.addEventListener('mouseleave', () => { document.body.classList.remove('cursor-interact'); }); });
    window.addEventListener('mousemove', (e) => { if (!cursorDot || !cursorOutline) return; const posX = e.clientX; const posY = e.clientY; cursorDot.style.left = `${posX}px`; cursorDot.style.top = `${posY}px`; cursorOutline.animate({ left: `${posX}px`, top: `${posY}px` }, { duration: 300, fill: "forwards" }); });
    console.log("DEBUG (Expert): Maxsus kursor sozlandi.");
}


/** Backenddan bog'liqlik ma'lumotlarini oladi va vis.js grafigini chizadi */
async function fetchAndRenderRelationships(text, container, loaderElement) {
    if (!container) { console.error("DEBUG (Expert): Grafik konteyneri topilmadi!"); return; }
    if (typeof vis === 'undefined' || !vis.Network || !vis.DataSet) { showGraphError("Grafik kutubxonasi (vis.js) yuklanmadi.", container, loaderElement); return; }
    console.log("DEBUG (Expert): /get_relationships ga fetch so'rovi boshlandi...");
    if (loaderElement) loaderElement.style.display = 'block';
    try {
        const response = await fetch('/get_relationships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text }) });
        const data = await response.json();
        if (!response.ok || data.error) { throw new Error(data.error || `Server ${response.status} xatosi qaytardi.`); }
        console.log("DEBUG (Expert): /get_relationships dan ma'lumot olindi.");
        if (data && Array.isArray(data.nodes) && Array.isArray(data.links)) {
            renderVisGraph(data.nodes, data.links, container, loaderElement);
        } else { throw new Error("Serverdan grafik uchun yaroqsiz ma'lumot keldi."); }
    } catch (error) { showGraphError(`Bog'liqlik grafigini yuklashda xatolik: ${error.message}`, container, loaderElement); }
}

/** vis.js yordamida bog'liqlik grafigini chizadi (SODDALASHTIRILGAN KO'RINISH, OLDINGI FIZIKA) */
function renderVisGraph(nodes, links, container, loaderElement) {
     console.log("DEBUG (Expert): renderVisGraph boshlandi (soddalashtirilgan ko'rinish).");
     if (!container || typeof vis === 'undefined') { return; }
     if (!Array.isArray(nodes) || !Array.isArray(links)) { return; }
     if (nodes.length === 0) { showGraphError("Matnda grafik uchun obyektlar topilmadi.", container, loaderElement); return; }

     try {
         const processedNodes = nodes.map(node => ({ ...node, id: String(node.id), title: `Tur: ${node.group}` }));
         const processedLinks = links.map(link => ({ ...link, from: String(link.from), to: String(link.to), title: link.label }));
         const nodesDataSet = new vis.DataSet(processedNodes);
         const edgesDataSet = new vis.DataSet(links.map(link => ({ ...link, from: String(link.from), to: String(link.to) })));
         const data = { nodes: nodesDataSet, edges: edgesDataSet };

         // --- GRAFIK SOZLAMALARI (SODDALASHTIRILGAN STIL, OLDINGI FIZIKA) ---
         const options = {
             nodes: {
                 shape: 'dot', size: 18, borderWidth: 2,
                 color: { border: 'rgba(255,255,255,0.4)', highlight: { border: 'rgba(var(--primary-color-rgb),1)', background: 'rgba(var(--primary-color-rgb),0.6)' }, hover: { border: 'rgba(var(--primary-color-rgb),0.8)', background: 'rgba(var(--primary-color-rgb),0.4)' } },
                 font: { color: '#e0e0e0', size: 12, face: "'Poppins', sans-serif" },
                 shadow: false
             },
             edges: {
                 width: 1, color: { color:'rgba(255,255,255,0.3)', highlight: 'rgba(var(--primary-color-rgb),0.9)', hover: 'rgba(var(--primary-color-rgb),0.7)', inherit: 'from' },
                 arrows: { to: { enabled: true, scaleFactor: 0.5, type: 'arrow' } },
                 smooth: { type: 'continuous' },
                 font: { align: 'middle', size: 9, color: '#b0b0b0', strokeWidth: 0 },
                 shadow: false
             },
             groups: { // Ranglar guruhga qarab
                 PERSON: { color: { background:'#2563eb', border:'#93c5fd' } }, LOCATION: { color: { background:'#16a34a', border:'#86efac' } }, ORGANIZATION: { color: { background:'#f59e0b', border:'#fcd34d' } }, SOHA: { color: { background:'#9333ea', border:'#d8b4fe' } }, TUSHUNCHA: { color: { background:'#14b8a6', border:'#99f6e4' } }, UNKNOWN: { color: { background:'#6c757d', border:'#adb5bd' } }
             },
             physics: { // <<< FIZIKA OLDINGI HOLATGA QAYTARILDI
                 enabled: true, solver: 'forceAtlas2Based',
                 forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100, springConstant: 0.08, damping: 0.4, avoidOverlap: 0.1 },
                 stabilization: { iterations: 150 }
             },
             interaction: { dragNodes: true, dragView: true, hover: true, zoomView: true, navigationButtons: true, keyboard: true, tooltipDelay: 200 },
             layout: { improvedLayout: true }
         };
         // --- SOZLAMALAR TUGADI ---

         console.log("DEBUG (Expert): vis.Network yaratilmoqda...");
         relationshipNetwork = new vis.Network(container, data, options); // Globalga saqlash
         console.log("DEBUG (Expert): vis.js grafigi muvaffaqiyatli yaratildi.");

         relationshipNetwork.on("stabilizationIterationsDone", () => {
             console.log("DEBUG (Expert): Grafik stabilizatsiyasi tugadi.");
             if (loaderElement) loaderElement.style.display = 'none';
             relationshipNetwork.fit();
         });
          setTimeout(() => { if (loaderElement && loaderElement.style.display !== 'none') { loaderElement.style.display = 'none'; } }, 5000); // Fallback

     } catch(graphError) { console.error("DEBUG (Expert): vis.js grafigini chizishda xatolik:", graphError); showGraphError("Grafikni chizishda xatolik.", container, loaderElement); }
     console.log("DEBUG (Expert): renderVisGraph tugadi.");
}

/** Grafik konteynerida xatolik xabarini ko'rsatadi */
function showGraphError(message, container, loaderElement) {
    console.error("DEBUG (Expert): Grafik xatosi:", message);
    if (loaderElement) loaderElement.style.display = 'none';
    if (container) { container.innerHTML = `<div class="placeholder-expert" style="opacity:1;"><i class="fas fa-exclamation-triangle" style="color: var(--error-color);"></i><p style="color: var(--error-color);">${message}</p></div>`; }
}


/** Backenddan sentiment dinamikasi ma'lumotlarini oladi va Chart.js grafigini chizadi */
async function fetchAndRenderSentimentDynamics(text, container, loaderElement) {
    if (!container) { console.error("DEBUG (Expert): Sentiment dinamikasi konteyneri topilmadi!"); return; }
    if (typeof Chart === 'undefined') { showErrorInContainer("Grafik kutubxonasi (Chart.js) yuklanmadi.", container, loaderElement); return; }
    console.log("DEBUG (Expert): /get_sentiment_dynamics ga fetch so'rovi boshlandi...");
    if (loaderElement) loaderElement.style.display = 'block';
    try {
        const response = await fetch('/get_sentiment_dynamics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text }) });
        const data = await response.json();
        if (!response.ok || data.error) { throw new Error(data.error || `Server ${response.status} xatosi qaytardi.`); }
        console.log("DEBUG (Expert): /get_sentiment_dynamics dan ma'lumot olindi.");
        if (data && Array.isArray(data.sentence_sentiments) && data.sentence_sentiments.length > 0) {
            if (loaderElement) loaderElement.style.display = 'none';
            renderSentimentDynamicsChart(data.sentence_sentiments, container);
        } else if (data && Array.isArray(data.sentence_sentiments) && data.sentence_sentiments.length === 0) { showErrorInContainer("Matnda dinamikani aniqlash uchun yetarli gap topilmadi.", container, loaderElement); }
        else { throw new Error("Serverdan dinamika uchun yaroqsiz ma'lumot keldi."); }
    } catch (error) { console.error("DEBUG (Expert): Sentiment dinamikasini olishda/chizishda xatolik:", error); showErrorInContainer(`Sentiment dinamikasini yuklashda xatolik: ${error.message}`, container, loaderElement); }
}

/** Chart.js yordamida sentiment dinamikasi grafigini chizadi (YAXSHILANGAN) */
function renderSentimentDynamicsChart(sentiments, container) {
    console.log("DEBUG (Expert): renderSentimentDynamicsChart boshlandi.");
    const canvas = container?.querySelector('#sentimentDynamicsChart');
    if (!canvas) { console.error("Canvas elementi 'sentimentDynamicsChart' topilmadi."); return; }
    if (typeof Chart === 'undefined') { console.error("Chart.js kutubxonasi topilmadi!"); return; }
    const computedStyle = getComputedStyle(document.body);
    const primaryRgbValue = computedStyle.getPropertyValue('--primary-color-rgb').trim() || '0, 170, 255';
    const lineBorderColor = `rgba(${primaryRgbValue}, 0.7)`;
    console.log("DEBUG: Hisoblangan borderColor:", lineBorderColor);
    const sentimentScores = sentiments.map(s => (s === 'POSITIVE' ? 1 : (s === 'NEGATIVE' ? -1 : 0)));
    const labels = sentiments.map((_, index) => `${index + 1}-Gap`);
    const pointBackgroundColors = sentimentScores.map(score => (score > 0 ? 'rgba(16, 185, 129, 0.9)' : (score < 0 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(108, 117, 125, 0.9)')));
    let existingChart = Chart.getChart(canvas); if (existingChart) { existingChart.destroy(); }
    try {
        sentimentChart = new Chart(canvas, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'Sentiment', data: sentimentScores, fill: { target: 'origin', above: 'rgba(16, 185, 129, 0.15)', below: 'rgba(239, 68, 68, 0.15)' }, borderColor: lineBorderColor, borderWidth: 2, tension: 0.3, pointBackgroundColor: pointBackgroundColors, pointBorderColor: 'rgba(255, 255, 255, 0.6)', pointRadius: 5, pointHoverRadius: 8, pointHoverBorderWidth: 2, pointHoverBorderColor: 'rgba(255, 255, 255, 0.9)' }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: -1.5, max: 1.5, ticks: { stepSize: 1, color: 'rgba(229, 231, 235, 0.7)', callback: function(value) { if (value === 1) return 'Ijobiy'; if (value === 0) return 'Neytral'; if (value === -1) return 'Salbiy'; return ''; } } }, x: { ticks: { color: 'rgba(229, 231, 235, 0.7)', font: { size: 11 } }, grid: { color: 'rgba(255, 255, 255, 0.05)' } } }, plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: 'rgba(0, 0, 0, 0.8)', titleFont: { size: 14, family: "'Poppins', sans-serif" }, bodyFont: { size: 12, family: "'Poppins', sans-serif" }, padding: 10, cornerRadius: 4, displayColors: false, callbacks: { label: function(context) { let score = context.parsed.y; return score === 1 ? 'Ijobiy' : (score === -1 ? 'Salbiy' : 'Neytral'); } } } }, hover: { mode: 'nearest', intersect: true }, animations: { tension: { duration: 800, easing: 'easeOutQuart', from: 0.6, to: 0.3 }, radius: { duration: 400, easing: 'easeOutQuad', from: 2, to: 5 } } }
        });
        console.log("DEBUG (Expert): Sentiment dinamikasi charti chizildi.");
    } catch(chartError) { console.error("DEBUG (Expert): Chart.js grafigini chizishda xatolik:", chartError); showErrorInContainer("Sentiment grafigini chizishda xatolik.", container, container.querySelector('.graph-loader')); }
}

/** Konteyner ichida xatolik xabarini ko'rsatadi */
function showErrorInContainer(message, container, loaderElement) {
    console.error("DEBUG (Expert): Konteyner xatosi:", message);
    if (loaderElement) loaderElement.style.display = 'none';
    if (container) { container.innerHTML = `<div class="placeholder-expert" style="opacity:1;"><i class="fas fa-exclamation-triangle" style="color: var(--error-color);"></i><p style="color: var(--error-color);">${message}</p></div>`; }
}


// --- Placeholder Funksiyalar ---
function renderKeywordNetworkPlaceholder() { const container = document.getElementById('keywordNetwork'); if (container) { console.log("DEBUG (Expert): Keyword network placeholder."); } }
function renderTopicModelingPlaceholder() { const container = document.getElementById('topicModeling'); if (container) { console.log("DEBUG (Expert): Topic modeling placeholder."); } }

