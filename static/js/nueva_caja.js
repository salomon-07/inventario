document.addEventListener("DOMContentLoaded", () => {
    cargarEstantes();
    document.getElementById("formCrearCaja")?.addEventListener("submit", guardarCaja);
});

async function cargarEstantes() {
    try {
        const respuesta = await fetch("/api/estantes/");
        if (respuesta.ok) {
            const estantes = await respuesta.json();
            const selectEstante = document.getElementById("id_estante");
            selectEstante.innerHTML = '<option value="">Selecciona un estante</option>';
            estantes.forEach(e => {
                selectEstante.innerHTML += `<option value="${e.id_estante}">${e.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error("Error cargando estantes:", error);
    }
}

async function guardarCaja(event) {
    event.preventDefault();

    const datos = {
        nombre: document.getElementById("nombre").value,
        codigo_qr: document.getElementById("codigo_qr").value,
        id_estante: document.getElementById("id_estante").value,
        estado: document.getElementById("estado").value,
        descripcion: document.getElementById("descripcion").value
    };

    try {
        const respuesta = await fetch("/api/cajas/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            await Swal.fire({
                title: "¡Caja creada!",
                text: "La caja se ha registrado correctamente.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
            window.location.href = "/cajas";
        } else {
            Swal.fire("Error", resultado.error || "No se pudo crear la caja.", "error");
        }
    } catch (error) {
        Swal.fire("Error", "Error de comunicación con el servidor.", "error");
    }
}