document.addEventListener("DOMContentLoaded", () => {
    cargarEntradas();
    cargarSelects();

    const formEntrada = document.getElementById("formEntrada");
    if (formEntrada) {
        formEntrada.addEventListener("submit", guardarEntrada);
    }
});

// 1. Cargar la tabla de entradas desde la API
async function cargarEntradas() {
    const tbody = document.getElementById("tablaEntradas");
    if (!tbody) return;

    try {
        const respuesta = await fetch("/api/entradas/");
        if (!respuesta.ok) throw new Error("Error al consultar las entradas");

        const entradas = await respuesta.json();

        if (!entradas || entradas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay entradas registradas.</td></tr>';
            return;
        }

        tbody.innerHTML = entradas.map(e => {
            const fechaFormateada = e.fecha ? new Date(e.fecha).toLocaleString() : '-';
            const cajaTexto = e.caja || e.codigo_caja ? (e.caja || `Caja: ${e.codigo_caja}`) : 'Sin caja';

            return `
                <tr>
                    <td>
                        <strong>${e.producto || '-'}</strong>
                        ${e.codigo_producto ? `<br><small style="color:#666">${e.codigo_producto}</small>` : ''}
                    </td>
                    <td>
                        <span style="background:#28a745; color:white; padding: 2px 8px; border-radius: 4px; font-weight:bold;">
                            +${e.cantidad}
                        </span>
                    </td>
                    <td>${cajaTexto}</td>
                    <td>${e.motivo || '-'}</td>
                    <td>${fechaFormateada}</td>
                    <td>
                        <button class="btn-secondary" onclick="verDetalleEntrada(${e.id_entrada})">Ver</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error cargando entradas:", error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty" style="color:red;">Error al cargar las entradas.</td></tr>';
    }
}

// 2. Cargar selects de Productos (con stock) y Cajas
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
                selectProd.innerHTML = '<option value="">Selecciona un producto</option>' +
                    productos.map(p => `<option value="${p.id_producto}">${p.nombre} (${p.codigo || 'Sin código'}) - Stock: ${p.stock}</option>`).join('');
            }
        }

        if (resCajas.ok) {
            const cajas = await resCajas.json();
            const selectCaja = document.getElementById("id_caja");
            if (selectCaja) {
                selectCaja.innerHTML = '<option value="">Sin caja asignada</option>' +
                    cajas.map(c => `<option value="${c.id_caja}">${c.nombre || c.codigo_qr}</option>`).join('');
            }
        }
    } catch (error) {
        console.error("Error cargando selectores:", error);
    }
}

// 3. Controles para abrir y cerrar el Modal
function abrirModalNuevo() {
    const form = document.getElementById("formEntrada");
    const modal = document.getElementById("modalEntrada");

    if (form) form.reset();
    if (modal) {
        modal.style.display = "flex";
        modal.classList.remove("hidden");
    }
}

function cerrarModal() {
    const modal = document.getElementById("modalEntrada");
    if (modal) {
        modal.style.display = "none";
        modal.classList.add("hidden");
    }
}

// 4. Guardar una nueva entrada (POST)
async function guardarEntrada(event) {
    event.preventDefault();

    const id_producto = document.getElementById("id_producto")?.value;
    const cantidad = parseInt(document.getElementById("cantidad")?.value) || 1;
    const id_caja_val = document.getElementById("id_caja")?.value;
    const id_caja = id_caja_val ? parseInt(id_caja_val) : null;
    const motivo = document.getElementById("motivo")?.value.trim();
    const observacion = document.getElementById("observacion")?.value.trim();

    // Validaciones de frontend
    if (!id_producto) {
        Swal.fire("Atención", "Debes seleccionar un producto.", "warning");
        return;
    }

    if (cantidad <= 0) {
        Swal.fire("Atención", "La cantidad debe ser mayor a 0.", "warning");
        return;
    }

    const datos = {
        id_producto: parseInt(id_producto),
        cantidad: cantidad,
        id_caja: id_caja,
        motivo: motivo,
        observacion: observacion
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
                text: resultado.mensaje || "El stock ha sido ingresado correctamente.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });

            cerrarModal();
            cargarEntradas();
            cargarSelects(); // Recarga la lista desplegable para reflejar el incremento de stock
        } else {
            Swal.fire("Error", resultado.error || "No se pudo registrar la entrada.", "error");
        }
    } catch (error) {
        console.error("Error al registrar entrada:", error);
        Swal.fire("Error", "Error de comunicación con el servidor.", "error");
    }
}

// 5. Ver detalle individual de una entrada
async function verDetalleEntrada(id_entrada) {
    try {
        const respuesta = await fetch(`/api/entradas/${id_entrada}`);
        if (!respuesta.ok) {
            Swal.fire("Error", "No se pudo obtener el detalle de la entrada.", "error");
            return;
        }
        const detalle = await respuesta.json();

        Swal.fire({
            title: `Detalle de Entrada #${id_entrada}`,
            html: `
                <div style="text-align: left; line-height: 1.8;">
                    <p><strong>Producto:</strong> ${detalle.producto || '-'}</p>
                    <p><strong>Cantidad:</strong> +${detalle.cantidad}</p>
                    <p><strong>Caja:</strong> ${detalle.caja || detalle.codigo_caja || 'Sin caja'}</p>
                    <p><strong>Fecha:</strong> ${detalle.fecha ? new Date(detalle.fecha).toLocaleString() : '-'}</p>
                    <p><strong>Motivo:</strong> ${detalle.motivo || '-'}</p>
                    <p><strong>Observación:</strong> ${detalle.observacion || '-'}</p>
                </div>
            `,
            icon: "info"
        });
    } catch (error) {
        console.error("Error al obtener detalle:", error);
        Swal.fire("Error", "Ocurrió un error al cargar el detalle.", "error");
    }
}