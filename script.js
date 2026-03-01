// Base de datos oficial extraída de los comunicados CP9/2026
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

html5QrCode.start(
    { facingMode: "environment" }, 
    { 
        fps: 20, // Aumentamos los cuadros por segundo para captar mejor el movimiento
        qrbox: { width: 280, height: 80 }, // Hacemos el cuadro más pequeño para forzar el enfoque en la serie
        aspectRatio: 1.777778 // Formato panorámico para móviles
    }, 
    (decodedText) => {
        // Log para ver en la consola de la PC qué está leyendo realmente
        console.log("Texto detectado:", decodedText); 
        
        const match = decodedText.match(/\d{7,8}/); // Busca grupos de 7 u 8 números
        if (match) {
            ejecutarValidacion(parseInt(match[0]));
            // Detenemos el escaneo un momento para mostrar el resultado
            html5QrCode.pause(true); 
            setTimeout(() => html5QrCode.resume(), 3000); 
        }
    }
).catch(err => console.error(err));

// Iniciar Escáner
document.getElementById('boton-escanear').addEventListener('click', () => {
    const config = { fps: 15, qrbox: { width: 300, height: 120 } };
    
    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
            // Buscamos un patrón de 8 números seguidos en la lectura
            const match = decodedText.match(/\d{8}/);
            if (match) {
                ejecutarValidacion(parseInt(match[0]));
            }
        }
    ).catch(err => {
        console.error(err);
        alert("Error: Asegúrate de usar HTTPS o configurar los permisos de cámara.");
    });
});

// Función para Ingreso Manual
function verificarManual() {
    const num = prompt("Ingresa los 8 dígitos del número de serie:");
    if (num) {
        // Limpiamos el texto para dejar solo números
        const soloNumeros = num.replace(/\D/g, "");
        if (soloNumeros.length >= 7) {
            ejecutarValidacion(parseInt(soloNumeros));
        } else {
            alert("El número de serie debe tener al menos 7 u 8 dígitos.");
        }
    }
}

function ejecutarValidacion(textoEscaneado) {
    // Convertimos a mayúsculas para evitar errores
    const texto = textoEscaneado.toUpperCase();
    
    // Si el texto contiene una 'A', es válido por defecto
    if (texto.includes('A')) {
        mostrarResultadoValido("Billete Serie A: Plena validez legal.");
        return;
    }

    // Si es Serie B, extraemos los números para comparar con las tablas del BCB
    const matchDeditos = texto.match(/\d{8}/);
    if (!matchDeditos) return;

    const numeroSerie = parseInt(matchDeditos[0]);
    const corteSeleccionado = document.getElementById('corte-seleccionado').value;

    const esInhabilitado = rangosInvalidos.find(r => 
        r.corte === corteSeleccionado && 
        numeroSerie >= r.desde && 
        numeroSerie <= r.hasta
    );

    if (esInhabilitado) {
        renderizarAlerta(numeroSerie, corteSeleccionado);
    } else {
        mostrarResultadoValido(`Serie B - Nº ${numeroSerie}: Billete Autorizado.`);
    }
}