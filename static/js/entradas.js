document.addEventListener("DOMContentLoaded", () => {
    cargarEntradas();
    cargarSelects();
    document.getElementById("formEntrada")?.addEventListener("submit", guardarEntrada);
});

async function cargarEntradas() {
    const tbody = document.getElementById("tablaEntradas");
    if (!tbody) return;

    try {
        const respuesta = await fetch("/api/entradas/");
        if (!respuesta.ok) throw new Error("Error en la petición");

        const entradas = await respuesta.json();

        if (entradas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay entradas registradas</td></tr>';
            return;
        }

        tbody.innerHTML = entradas.map(e => `
            <tr>
                <td>${e.producto || '-'}</td>
                <td>${e.cantidad}</td>
                <td>${e.caja || 'Sin caja'}</td>
                <td>${e.motivo || '-'}</td>
                <td>${e.fecha || '-'}</td>
                <td>
                    <button class="btn-secondary" onclick="verDetalleEntrada(${e.id_entrada})">Ver</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error cargando entradas:", error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay entradas registradas</td></tr>';
    }
}

async function cargarSelects() {
    try {
        const [resProd, resCajas] = await Promise.all([
            fetch("/api/productos/"),
            fetch("/api/cajas/")
        ]);

        if (resProd.ok) {
            const productos = await resProd.json();
            const selectProd = document.getElementById("id_producto");
            if (selectProd) {
                selectProd.innerHTML = '<option value="">Selecciona un producto</option>';
                productos.forEach(p => {
                    selectProd.innerHTML += `<option value="${p.id_producto}">${p.nombre} (${p.codigo || 'Sin código'})</option>`;
                });
            }
        }

        if (resCajas.ok) {
            const cajas = await resCajas.json();
            const selectCaja = document.getElementById("id_caja");
            if (selectCaja) {
                selectCaja.innerHTML = '<option value="">Sin caja asignada</option>';
                cajas.forEach(c => {
                    selectCaja.innerHTML += `<option value="${c.id_caja}">${c.nombre}</option>`;
                });
            }
        }
    } catch (error) {
        console.error("Error cargando selectores:", error);
    }
}

function abrirModalNuevo() {
    document.getElementById("formEntrada")?.reset();
    const modal = document.getElementById("modalEntrada");
    if (modal) modal.style.display = "flex";
}

function cerrarModal() {
    const modal = document.getElementById("modalEntrada");
    if (modal) modal.style.display = "none";
}

async function guardarEntrada(event) {
    event.preventDefault();

    const datos = {
        id_producto: document.getElementById("id_producto").value,
        cantidad: parseInt(document.getElementById("cantidad").value) || 1,
        id_caja: document.getElementById("id_caja").value || null,
        motivo: document.getElementById("motivo").value,
        observacion: document.getElementById("observacion").value
    };

    try {
        const respuesta = await fetch("/api/entradas/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            await Swal.fire({
                title: "¡Entrada registrada!",
                text: "El stock ha sido ingresado correctamente.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
            cerrarModal();
            cargarEntradas();
        } else {
            Swal.fire("Error", resultado.error || "No se pudo registrar la entrada.", "error");
        }
    } catch (error) {
        Swal.fire("Error", "Error de comunicación con el servidor.", "error");
    }
}