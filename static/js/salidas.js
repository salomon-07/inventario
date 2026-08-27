document.addEventListener("DOMContentLoaded", () => {
    cargarSalidas();
    cargarProductos();
    document.getElementById("formSalida")?.addEventListener("submit", guardarSalida);
});

async function cargarSalidas() {
    const tbody = document.getElementById("tablaSalidas");
    if (!tbody) return;

    try {
        const respuesta = await fetch("/api/salidas/");
        if (!respuesta.ok) throw new Error("Error en la petición");

        const salidas = await respuesta.json();

        if (salidas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay salidas registradas</td></tr>';
            return;
        }

        tbody.innerHTML = salidas.map(s => `
            <tr>
                <td>${s.producto || '-'}</td>
                <td>${s.cantidad}</td>
                <td>${s.destino || s.tipo_salida || '-'}</td>
                <td>${s.fecha || '-'}</td>
                <td>${s.observacion || '-'}</td>
                <td>
                    <button class="btn-secondary" onclick="verDetalleSalida(${s.id_salida})">Ver</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error cargando salidas:", error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay salidas registradas</td></tr>';
    }
}

async function cargarProductos() {
    try {
        const respuesta = await fetch("/api/productos/");
        if (respuesta.ok) {
            const productos = await respuesta.json();
            const selectProd = document.getElementById("id_producto");
            if (selectProd) {
                selectProd.innerHTML = '<option value="">Selecciona un producto</option>';
                productos.forEach(p => {
                    selectProd.innerHTML += `<option value="${p.id_producto}">${p.nombre} (Stock: ${p.stock})</option>`;
                });
            }
        }
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

function abrirModalNuevo() {
    document.getElementById("formSalida")?.reset();
    const modal = document.getElementById("modalSalida");
    if (modal) modal.style.display = "flex";
}

function cerrarModal() {
    const modal = document.getElementById("modalSalida");
    if (modal) modal.style.display = "none";
}

async function guardarSalida(event) {
    event.preventDefault();

    const datos = {
        id_producto: document.getElementById("id_producto").value,
        cantidad: parseInt(document.getElementById("cantidad").value) || 1,
        tipo_salida: document.getElementById("tipo_salida").value,
        destino: document.getElementById("destino").value,
        observacion: document.getElementById("observacion").value
    };

    try {
        const respuesta = await fetch("/api/salidas/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            await Swal.fire({
                title: "¡Salida registrada!",
                text: "Se ha descontado el stock correctamente.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
            cerrarModal();
            cargarSalidas();
        } else {
            Swal.fire("Error", resultado.error || "No se pudo registrar la salida.", "error");
        }
    } catch (error) {
        Swal.fire("Error", "Error de comunicación con el servidor.", "error");
    }
}