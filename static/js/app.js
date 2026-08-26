let scanner = null;
let scannerActivo = false;


/*
|--------------------------------------------------------------------------
| INICIAR
|--------------------------------------------------------------------------
*/

document.addEventListener("DOMContentLoaded", () => {

    const btnScanner =
        document.getElementById("btnScanner");

    const btnAbrirScanner =
        document.getElementById("btnAbrirScanner");

    const btnCerrarScanner =
        document.getElementById("btnCerrarScanner");


    if (btnScanner) {

        btnScanner.addEventListener(
            "click",
            abrirScanner
        );

    }


    if (btnAbrirScanner) {

        btnAbrirScanner.addEventListener(
            "click",
            abrirScanner
        );

    }


    if (btnCerrarScanner) {

        btnCerrarScanner.addEventListener(
            "click",
            cerrarScanner
        );

    }

});


/*
|--------------------------------------------------------------------------
| CARGAR LIBRERÍA
|--------------------------------------------------------------------------
*/

function cargarLibreriaScanner() {

    return new Promise((resolve, reject) => {

        if (typeof Html5Qrcode !== "undefined") {
            resolve();
            return;
        }

        const script = document.createElement("script");

        script.src =
            "https://unpkg.com/html5-qrcode";

        script.onload = () => {
            resolve();
        };

        script.onerror = () => {
            reject(
                new Error(
                    "No se pudo cargar el lector QR."
                )
            );
        };

        document.head.appendChild(script);

    });

}


/*
|--------------------------------------------------------------------------
| ABRIR SCANNER
|--------------------------------------------------------------------------
*/

async function abrirScanner() {

    const modal =
        document.getElementById("scannerModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");

    try {

        await cargarLibreriaScanner();

        iniciarCamara();

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "No se pudo cargar el lector QR.",
            "error"
        );

    }

}


/*
|--------------------------------------------------------------------------
| INICIAR CÁMARA
|--------------------------------------------------------------------------
*/

async function iniciarCamara() {

    if (scannerActivo) {
        return;
    }

    const reader =
        document.getElementById("reader");

    if (!reader) {
        return;
    }

    reader.innerHTML = "";

    scanner = new Html5Qrcode("reader");

    try {

        const camaras =
            await Html5Qrcode.getCameras();

        if (!camaras || camaras.length === 0) {

            mostrarMensaje(
                "No se encontró ninguna cámara.",
                "error"
            );

            return;
        }


        /*
         * Intentar utilizar la cámara trasera.
         */

        let camaraSeleccionada =
            camaras[0].id;

        const camaraTrasera =
            camaras.find(camara => {

                const nombre =
                    camara.label.toLowerCase();

                return (
                    nombre.includes("back") ||
                    nombre.includes("rear") ||
                    nombre.includes("trasera")
                );

            });

        if (camaraTrasera) {
            camaraSeleccionada =
                camaraTrasera.id;
        }


        await scanner.start(
            camaraSeleccionada,
            {
                fps: 10,

                qrbox: {
                    width: 250,
                    height: 250
                },

                aspectRatio: 1.0

            },

            codigoEscaneado,

            () => {
                // Se ejecuta cuando no se detecta código.
            }
        );

        scannerActivo = true;

    } catch (error) {

        console.error(
            "Error iniciando cámara:",
            error
        );

        mostrarMensaje(
            "No se pudo acceder a la cámara. Verifica los permisos del navegador.",
            "error"
        );

    }

}


/*
|--------------------------------------------------------------------------
| QR DETECTADO
|--------------------------------------------------------------------------
*/

async function codigoEscaneado(codigo) {

    if (!codigo) {
        return;
    }

    console.log(
        "QR detectado:",
        codigo
    );

    /*
     * Detener la cámara inmediatamente
     */

    await detenerScanner();

    /*
     * Cerrar modal
     */

    cerrarModal();

    /*
     * Colocar código en el input
     */

    const input =
        document.getElementById("codigoCaja");

    if (input) {
        input.value = codigo;
    }

    /*
     * Buscar automáticamente la caja
     */

    if (typeof buscarCaja === "function") {
        await buscarCaja();
    }

}


/*
|--------------------------------------------------------------------------
| DETENER SCANNER
|--------------------------------------------------------------------------
*/

async function detenerScanner() {

    if (!scanner || !scannerActivo) {
        return;
    }

    try {

        await scanner.stop();

        scanner.clear();

    } catch (error) {

        console.error(
            "Error deteniendo scanner:",
            error
        );

    }

    scannerActivo = false;
    scanner = null;

}


/*
|--------------------------------------------------------------------------
| CERRAR SCANNER
|--------------------------------------------------------------------------
*/

async function cerrarScanner() {

    await detenerScanner();

    cerrarModal();

}


/*
|--------------------------------------------------------------------------
| CERRAR MODAL
|--------------------------------------------------------------------------
*/

function cerrarModal() {

    const modal =
        document.getElementById("scannerModal");

    if (modal) {
        modal.classList.add("hidden");
    }

}