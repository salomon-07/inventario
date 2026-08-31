let scanner = null;
let scannerActivo = false;

document.addEventListener("DOMContentLoaded", () => {
    const btnScanner = document.getElementById("btnScanner");
    const btnAbrirScanner = document.getElementById("btnAbrirScanner");
    const btnCerrarScanner = document.getElementById("btnCerrarScanner");
    const btnEscanear = document.getElementById("btnEscanear");
    const btnDetenerEscanear = document.getElementById("btnDetenerEscanear");

    if (btnScanner) btnScanner.addEventListener("click", abrirScanner);
    if (btnAbrirScanner) btnAbrirScanner.addEventListener("click", abrirScanner);
    if (btnCerrarScanner) btnCerrarScanner.addEventListener("click", cerrarScanner);
    if (btnEscanear) btnEscanear.addEventListener("click", abrirScanner);
    if (btnDetenerEscanear) btnDetenerEscanear.addEventListener("click", cerrarScanner);
});

// Reemplazo seguro para mostrar mensajes usando SweetAlert2 o alert estándar
function mostrarMensaje(mensaje, tipo = "error") {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            icon: tipo,
            title: tipo === "error" ? "Error" : "Información",
            text: mensaje
        });
    } else {
        alert(mensaje);
    }
}

function cargarLibreriaScanner() {
    return new Promise((resolve, reject) => {
        if (typeof Html5Qrcode !== "undefined") {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://unpkg.com/html5-qrcode";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("No se pudo cargar el lector QR."));
        document.head.appendChild(script);
    });
}

async function abrirScanner() {
    const modal = document.getElementById("scannerModal");
    const contenedor = document.getElementById("contenedorEscanear");

    if (modal) modal.classList.remove("hidden");
    if (contenedor) contenedor.style.display = "block";

    try {
        await cargarLibreriaScanner();
        await iniciarCamara();
    } catch (error) {
        console.error("Error al abrir escáner:", error);
        mostrarMensaje("No se pudo cargar la librería de escaneo.", "error");
    }
}

async function iniciarCamara() {
    if (scannerActivo) return;

    const reader = document.getElementById("reader");
    if (!reader) return;

    reader.innerHTML = "";
    scanner = new Html5Qrcode("reader");

    // Dimensión rectangular ajustada para facilitar la lectura de códigos de barras (1D)
    const config = {
        fps: 10,
        qrbox: { width: 260, height: 150 },
        aspectRatio: 1.0
    };

    try {
        const camaras = await Html5Qrcode.getCameras();

        if (camaras && camaras.length > 0) {
            let camaraSeleccionada = camaras[0].id;

            const camaraTrasera = camaras.find(camara => {
                const nombre = (camara.label || "").toLowerCase();
                return (
                    nombre.includes("back") ||
                    nombre.includes("rear") ||
                    nombre.includes("trasera") ||
                    nombre.includes("environment")
                );
            });

            if (camaraTrasera) {
                camaraSeleccionada = camaraTrasera.id;
            }

            await scanner.start(camaraSeleccionada, config, codigoEscaneado, () => {});
        } else {
            // Forzar uso de cámara trasera si no se devuelven etiquetas de dispositivos
            await scanner.start({ facingMode: "environment" }, config, codigoEscaneado, () => {});
        }

        scannerActivo = true;

    } catch (error) {
        console.warn("Reintentando inicialización con modo estándar de cámara trasera...", error);
        try {
            await scanner.start({ facingMode: "environment" }, config, codigoEscaneado, () => {});
            scannerActivo = true;
        } catch (errFinal) {
            console.error("Error iniciando cámara:", errFinal);
            mostrarMensaje("No se pudo acceder a la cámara. Verifica los permisos del navegador.", "error");
        }
    }
}

async function codigoEscaneado(codigo) {
    if (!codigo) return;

    console.log("Código detectado:", codigo);

    await detenerScanner();
    cerrarModal();

    // Asignación compatible con 'codigo' (formulario de productos) y 'codigoCaja' (búsquedas)
    const input = document.getElementById("codigo") || document.getElementById("codigoCaja");

    if (input) {
        input.value = codigo;
        input.dispatchEvent(new Event("input"));
        input.dispatchEvent(new Event("change"));
    }

    if (typeof buscarCaja === "function") {
        await buscarCaja();
    }
}

async function detenerScanner() {
    if (!scanner || !scannerActivo) return;

    try {
        await scanner.stop();
        scanner.clear();
    } catch (error) {
        console.error("Error deteniendo scanner:", error);
    }

    scannerActivo = false;
    scanner = null;
}

async function cerrarScanner() {
    await detenerScanner();
    cerrarModal();
}

function cerrarModal() {
    const modal = document.getElementById("scannerModal");
    const contenedor = document.getElementById("contenedorEscanear");

    if (modal) modal.classList.add("hidden");
    if (contenedor) contenedor.style.display = "none";
}