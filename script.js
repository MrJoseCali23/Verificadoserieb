// Base de datos oficial - Comunicado CP9/2026 (28 de febrero de 2026)
const rangosInvalidos = [
    // Corte Bs50
    { corte: "50", desde: 67250001, hasta: 67700000 }, { corte: "50", desde: 69050001, hasta: 69500000 },
    { corte: "50", desde: 69500001, hasta: 69950000 }, { corte: "50", desde: 69950001, hasta: 70400000 },
    { corte: "50", desde: 70400001, hasta: 70850000 }, { corte: "50", desde: 70850001, hasta: 71300000 },
    { corte: "50", desde: 76310012, hasta: 85139995 }, { corte: "50", desde: 86400001, hasta: 86850000 },
    { corte: "50", desde: 90900001, hasta: 91350000 }, { corte: "50", desde: 91800001, hasta: 92250000 },
    // Corte Bs20
    { corte: "20", desde: 87280145, hasta: 91646549 }, { corte: "20", desde: 96650001, hasta: 97100000 },
    { corte: "20", desde: 99800001, hasta: 100250000 }, { corte: "20", desde: 100250001, hasta: 100700000 },
    { corte: "20", desde: 109250001, hasta: 109700000 }, { corte: "20", desde: 110600001, hasta: 111050000 },
    { corte: "20", desde: 111050001, hasta: 111500000 }, { corte: "20", desde: 111950001, hasta: 112400000 },
    { corte: "20", desde: 112400001, hasta: 112850000 }, { corte: "20", desde: 112850001, hasta: 113300000 },
    { corte: "20", desde: 114200001, hasta: 114650000 }, { corte: "20", desde: 114650001, hasta: 115100000 },
    { corte: "20", desde: 115100001, hasta: 115550000 }, { corte: "20", desde: 118700001, hasta: 119150000 },
    { corte: "20", desde: 119150001, hasta: 119600000 }, { corte: "20", desde: 120500001, hasta: 120950000 },
    // Corte Bs10
    { corte: "10", desde: 77100001, hasta: 77550000 }, { corte: "10", desde: 78000001, hasta: 78450000 },
    { corte: "10", desde: 78900001, hasta: 96350000 }, { corte: "10", desde: 96350001, hasta: 96800000 },
    { corte: "10", desde: 96800001, hasta: 97250000 }, { corte: "10", desde: 98150001, hasta: 98600000 },
    { corte: "10", desde: 104900001, hasta: 105350000 }, { corte: "10", desde: 105350001, hasta: 105800000 },
    { corte: "10", desde: 106700001, hasta: 107150000 }, { corte: "10", desde: 107600001, hasta: 108050000 },
    { corte: "10", desde: 108050001, hasta: 108500000 }, { corte: "10", desde: 109400001, hasta: 109850000 }
];

let streamActivo = null;
let escaneando = false;
let timerEscaneo = null;
let ultimoTextoDetectado = null;

const botonEncender = document.getElementById('boton-escanear');
const botonApagar   = document.getElementById('boton-apagar');
const video  = document.getElementById('reader');
const canvas = document.getElementById('canvas');

// ── Encender cámara ──────────────────────────────────────────────
botonEncender.addEventListener('click', async () => {
    if (escaneando) return;
    try {
        streamActivo = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });
        video.srcObject = streamActivo;
        await video.play();
        escaneando = true;
        botonEncender.disabled = true;
        botonApagar.disabled = false;
        iniciarBucleEscaneo();
    } catch (err) {
        alert("Permisos de cámara denegados. Use HTTPS o configure chrome://flags.");
    }
});

// ── Apagar cámara ────────────────────────────────────────────────
botonApagar.addEventListener('click', () => {
    detenerEscaneo();
});

function detenerEscaneo() {
    if (streamActivo) {
        streamActivo.getTracks().forEach(t => t.stop());
        streamActivo = null;
    }
    escaneando = false;
    clearTimeout(timerEscaneo);
    video.srcObject = null;
    ultimoTextoDetectado = null;
    botonEncender.disabled = false;
    botonApagar.disabled = true;
}

// ── Bucle de escaneo con debounce (cada 1500ms) ──────────────────
function iniciarBucleEscaneo() {
    if (!escaneando) return;
    timerEscaneo = setTimeout(async () => {
        await capturarYLeer();
        iniciarBucleEscaneo();
    }, 1500);
}

async function capturarYLeer() {
    if (!escaneando || video.readyState < 2) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
            tessedit_char_whitelist: '0123456789AB '
        });
        if (text.trim()) ejecutarValidacion(text);
    } catch (e) { /* continuar silenciosamente */ }
}

// ── Ingreso Manual ───────────────────────────────────────────────
function verificarManual() {
    const entrada = prompt("Ingrese el número y serie (ej: 12345678 B):");
    if (entrada) ejecutarValidacion(entrada);
}

// ── Validación Unificada ─────────────────────────────────────────
function ejecutarValidacion(datoDetectado) {
    const texto = datoDetectado.toUpperCase();
    const resultadoDiv = document.getElementById('resultado-cuadro');
    const mensaje      = document.getElementById('mensaje-estado');
    const icono        = document.getElementById('icono-estado');

    // Formato esperado: XXXXXXXX A/B
    const matchBillete = texto.match(/(\d{8})\s*([AB])/);
    if (!matchBillete) return;

    // Debounce: ignorar si ya se procesó este mismo número
    if (matchBillete[0] === ultimoTextoDetectado) return;
    ultimoTextoDetectado = matchBillete[0];

    const numeroSerie = parseInt(matchBillete[1]);
    const serie = matchBillete[2];

    // 1. Serie A → siempre válido
    if (serie === 'A') {
        icono.textContent = '✅';
        resultadoDiv.className = "valido";
        mensaje.innerHTML = `<b>SERIE A: BILLETE VÁLIDO</b><br>Nº ${numeroSerie}<br>Toda la Serie A mantiene plena validez legal.`;
        return;
    }

    // 2. Serie B → buscar en TODOS los cortes (auto-detección)
    const rangoEncontrado = rangosInvalidos.find(r =>
        numeroSerie >= r.desde && numeroSerie <= r.hasta
    );

    if (rangoEncontrado) {
        icono.textContent = '❌';
        resultadoDiv.className = "peligro";
        mensaje.innerHTML = `<b>SIN VALOR LEGAL</b><br>Corte Bs${rangoEncontrado.corte} - Nº ${numeroSerie}<br>Serie B inhabilitada por el BCB.`;
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    } else {
        icono.textContent = '✅';
        resultadoDiv.className = "valido";
        mensaje.innerHTML = `<b>SERIE B: AUTORIZADA</b><br>Nº ${numeroSerie}<br>No se encuentra en el lote sustraído.`;
    }
}