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

const html5QrCode = new Html5Qrcode("reader");

document.getElementById('boton-escanear').addEventListener('click', () => {
    const config = { 
        fps: 20, 
        qrbox: { width: 280, height: 100 },
        aspectRatio: 1.777778 
    };
    
    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
            ejecutarValidacion(decodedText);
        }
    ).catch(err => {
        alert("Error: Activa el HTTPS o los permisos de cámara.");
    });
});

function ejecutarValidacion(textoDetectado) {
    const texto = textoDetectado.toUpperCase();
    const resultadoDiv = document.getElementById('resultado-cuadro');
    const mensaje = document.getElementById('mensaje-estado');

    // 1. Identificar Serie A (Válido por defecto)
    if (texto.includes('A')) {
        resultadoDiv.className = "valido";
        mensaje.innerHTML = `✅ <b>SERIE A: BILLETE VÁLIDO</b><br>Todos los billetes Serie A son legales.`;
        return;
    }

    // 2. Identificar Serie B y extraer números
    const matchNumeros = texto.match(/\d{7,8}/);
    if (!matchNumeros) return; // Si no hay números, seguimos buscando

    const numeroSerie = parseInt(matchNumeros[0]);
    const corteSeleccionado = document.getElementById('corte-seleccionado').value;

    const esInhabilitado = rangosInvalidos.find(r => 
        r.corte === corteSeleccionado && 
        numeroSerie >= r.desde && 
        numeroSerie <= r.hasta
    );

    if (esInhabilitado) {
        resultadoDiv.className = "peligro";
        mensaje.innerHTML = `❌ <b>SIN VALOR LEGAL</b><br>Serie B: ${numeroSerie}<br>Corte Bs${corteSeleccionado} inhabilitado.`;
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    } else {
        resultadoDiv.className = "valido";
        mensaje.innerHTML = `✅ <b>SERIE B: VÁLIDO</b><br>Nº ${numeroSerie}<br>Fuera de las series del accidente.`;
    }
}

function verificarManual() {
    const num = prompt("Ingresa el número de serie (ej: 76310020 B):");
    if (num) ejecutarValidacion(num);
}