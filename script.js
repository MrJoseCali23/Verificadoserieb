const rangosInvalidos = [
    { corte: "50", desde: 67250001, hasta: 67700000 }, { corte: "50", desde: 69050001, hasta: 69500000 },
    { corte: "50", desde: 69500001, hasta: 69950000 }, { corte: "50", desde: 69950001, hasta: 70400000 },
    { corte: "50", desde: 70400001, hasta: 70850000 }, { corte: "50", desde: 70850001, hasta: 71300000 },
    { corte: "50", desde: 76310012, hasta: 85139995 }, { corte: "50", desde: 86400001, hasta: 86850000 },
    { corte: "50", desde: 90900001, hasta: 91350000 }, { corte: "50", desde: 91800001, hasta: 92250000 },
    { corte: "20", desde: 87280145, hasta: 91646549 }, { corte: "20", desde: 96650001, hasta: 97100000 },
    { corte: "20", desde: 99800001, hasta: 100250000 }, { corte: "20", desde: 100250001, hasta: 100700000 },
    { corte: "20", desde: 109250001, hasta: 109700000 }, { corte: "20", desde: 110600001, hasta: 111050000 },
    { corte: "20", desde: 111050001, hasta: 111500000 }, { corte: "20", desde: 111950001, hasta: 112400000 },
    { corte: "20", desde: 112400001, hasta: 112850000 }, { corte: "20", desde: 112850001, hasta: 113300000 },
    { corte: "20", desde: 114200001, hasta: 114650000 }, { corte: "20", desde: 114650001, hasta: 115100000 },
    { corte: "20", desde: 115100001, hasta: 115550000 }, { corte: "20", desde: 118700001, hasta: 119150000 },
    { corte: "20", desde: 119150001, hasta: 119600000 }, { corte: "20", desde: 120500001, hasta: 120950000 },
    { corte: "10", desde: 77100001, hasta: 77550000 }, { corte: "10", desde: 78000001, hasta: 78450000 },
    { corte: "10", desde: 78900001, hasta: 96350000 }, { corte: "10", desde: 96350001, hasta: 96800000 },
    { corte: "10", desde: 96800001, hasta: 97250000 }, { corte: "10", desde: 98150001, hasta: 98600000 },
    { corte: "10", desde: 104900001, hasta: 105350000 }, { corte: "10", desde: 105350001, hasta: 105800000 },
    { corte: "10", desde: 106700001, hasta: 107150000 }, { corte: "10", desde: 107600001, hasta: 108050000 },
    { corte: "10", desde: 108050001, hasta: 108500000 }, { corte: "10", desde: 109400001, hasta: 109850000 }
];

let streamActivo = null;
let escaneando = false;
let linternaActiva = false;
let ultimoTextoDetectado = null;
let contValidos = 0;
let contInvalidos = 0;
let historial = [];
let workerListo = false;
let tesseractWorker = null;

const switchCamara  = document.getElementById('switch-camara');
const botonCapturar = document.getElementById('boton-capturar');
const botonLinterna = document.getElementById('boton-linterna');
const video         = document.getElementById('reader');
const canvas        = document.getElementById('canvas');
const procesando    = document.getElementById('procesando');

(async () => {
    tesseractWorker = await Tesseract.createWorker('eng');
    await tesseractWorker.setParameters({ tessedit_char_whitelist: '0123456789AB ' });
    // Calentamiento silencioso: paga el costo de arranque antes de la primera lectura real
    const warmCanvas = document.createElement('canvas');
    warmCanvas.width = 100; warmCanvas.height = 30;
    await tesseractWorker.recognize(warmCanvas);
    workerListo = true;
    document.getElementById('mensaje-estado').textContent = 'Active la cámara y presione LEER BILLETE';
})();

switchCamara.addEventListener('change', async () => {
    if (switchCamara.checked) {
        try {
            streamActivo = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            video.srcObject = streamActivo;
            await video.play();
            escaneando = true;
            botonCapturar.disabled = false;
            botonLinterna.disabled = false;
        } catch (err) {
            switchCamara.checked = false;
            alert("Permisos de cámara denegados. Use HTTPS o configure chrome://flags.");
        }
    } else {
        if (streamActivo) streamActivo.getTracks().forEach(t => t.stop());
        streamActivo = null;
        escaneando = false;
        linternaActiva = false;
        video.srcObject = null;
        ultimoTextoDetectado = null;
        botonCapturar.disabled = true;
        botonLinterna.disabled = true;
        botonLinterna.textContent = '🔦 LINTERNA';
    }
});

botonCapturar.addEventListener('click', async () => {
    if (!escaneando || !workerListo) return;
    botonCapturar.disabled = true;
    procesando.classList.remove('oculto');
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cropX = Math.floor(vw * 0.225);
    const cropY = Math.floor(vh * 0.44);
    const cropW = Math.floor(vw * 0.55);
    const cropH = Math.floor(vh * 0.12);
    canvas.width  = cropW * 2;
    canvas.height = cropH * 2;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    try {
        const { data: { text } } = await tesseractWorker.recognize(canvas);
        if (text.trim()) {
            ejecutarValidacion(text);
        } else {
            mostrarMensajeTemp('No se detectó texto. Reintenta.');
        }
    } catch (e) {
        mostrarMensajeTemp('Error al procesar imagen.');
    } finally {
        procesando.classList.add('oculto');
        botonCapturar.disabled = false;
    }
});

botonLinterna.addEventListener('click', async () => {
    if (!streamActivo) return;
    const track = streamActivo.getVideoTracks()[0];
    const caps  = track.getCapabilities();
    if (!caps.torch) { alert('Tu dispositivo no soporta linterna.'); return; }
    linternaActiva = !linternaActiva;
    await track.applyConstraints({ advanced: [{ torch: linternaActiva }] });
    botonLinterna.textContent = linternaActiva ? '🔦 APAGAR LUZ' : '🔦 LINTERNA';
});

function verificarManual() {
    const entrada = prompt('Ingrese el número y serie (ej: 100250001 B):');
    if (entrada) ejecutarValidacion(entrada);
}

function ejecutarValidacion(datoDetectado) {
    const texto = datoDetectado.toUpperCase();
    const resultadoDiv = document.getElementById('resultado-cuadro');
    const mensaje      = document.getElementById('mensaje-estado');
    const icono        = document.getElementById('icono-estado');

    const matchBillete = texto.match(/(\d{8,10})\s*([AB])/);
    if (!matchBillete) { mostrarMensajeTemp('Formato no reconocido. Reintenta.'); return; }

    if (matchBillete[0] === ultimoTextoDetectado) return;
    ultimoTextoDetectado = matchBillete[0];

    const numeroSerie = parseInt(matchBillete[1]);
    const serie = matchBillete[2];

    if (navigator.vibrate) navigator.vibrate(100);

    if (serie === 'A') {
        icono.textContent = '✅';
        resultadoDiv.className = 'valido';
        mensaje.innerHTML = `<b>SERIE A: BILLETE VÁLIDO</b><br>Nº ${numeroSerie}<br>Plena validez legal.`;
        agregarHistorial(numeroSerie, 'A', null, true);
        contValidos++;
        actualizarContador();
        return;
    }

    const rangoEncontrado = rangosInvalidos.find(r =>
        numeroSerie >= r.desde && numeroSerie <= r.hasta
    );

    if (rangoEncontrado) {
        icono.textContent = '❌';
        resultadoDiv.className = 'peligro';
        mensaje.innerHTML = `<b>SIN VALOR LEGAL</b><br>Bs${rangoEncontrado.corte} - Nº ${numeroSerie}<br>Serie B inhabilitada por el BCB.`;
        agregarHistorial(numeroSerie, 'B', rangoEncontrado.corte, false);
        contInvalidos++;
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    } else {
        icono.textContent = '✅';
        resultadoDiv.className = 'valido';
        mensaje.innerHTML = `<b>SERIE B: AUTORIZADA</b><br>Nº ${numeroSerie}<br>No está en el lote sustraído.`;
        agregarHistorial(numeroSerie, 'B', null, true);
        contValidos++;
    }
    actualizarContador();
}

function agregarHistorial(numero, serie, corte, valido) {
    const hora = new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const item = { numero, serie, corte, valido, hora };
    historial.unshift(item);
    renderHistorial();
}

function renderHistorial() {
    const lista = document.getElementById('historial-lista');
    lista.innerHTML = historial.map(h => {
        const etiqueta = h.valido
            ? `✅ VÁLIDO`
            : `❌ INVÁLIDO`;
        const detalle = h.corte ? ` (Bs${h.corte})` : '';
        return `<li class="${h.valido ? 'hist-valido' : 'hist-peligro'}">
            <span>${etiqueta}</span> Serie ${h.serie}${detalle} — Nº ${h.numero}
            <small>${h.hora}</small>
        </li>`;
    }).join('');
}

function limpiarHistorial() {
    historial = [];
    contValidos = 0;
    contInvalidos = 0;
    ultimoTextoDetectado = null;
    renderHistorial();
    actualizarContador();
}

function actualizarContador() {
    document.getElementById('cnt-validos').textContent  = contValidos;
    document.getElementById('cnt-invalidos').textContent = contInvalidos;
}

function mostrarMensajeTemp(msg) {
    const mensaje = document.getElementById('mensaje-estado');
    const icono   = document.getElementById('icono-estado');
    const cuadro  = document.getElementById('resultado-cuadro');
    icono.textContent = '⚠️';
    cuadro.className = 'advertencia';
    mensaje.textContent = msg;
}

function abrirDonar() {
    document.getElementById('modal-donar').classList.remove('oculto');
}

function cerrarDonar(e) {
    if (!e || e.target === document.getElementById('modal-donar')) {
        document.getElementById('modal-donar').classList.add('oculto');
    }
}