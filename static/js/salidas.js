document.addEventListener("DOMContentLoaded", () => {
    cargarSalidas();
    cargarProductos();

    const formSalida = document.getElementById("formSalida");
    if (formSalida) {
        formSalida.addEventListener("submit", guardarSalida);
    }
});

// 1. Cargar la tabla de salidas desde la API
async function cargarSalidas() {
    const tbody = document.getElementById("tablaSalidas");
    if (!tbody) return;

    try {
        const respuesta = await fetch("/api/salidas/");
        if (!respuesta.ok) throw new Error("Error en la petición al obtener salidas");

        const salidas = await respuesta.json();

        if (!salidas || salidas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay salidas registradas.</td></tr>';
            return;
        }

        tbody.innerHTML = salidas.map(s => {
            const fechaFormateada = s.fecha ? new Date(s.fecha).toLocaleString() : '-';
            return `
                <tr>
                    <td>
                        <strong>${s.producto || '-'}</strong>
                        ${s.codigo_producto ? `<br><small style="color:#666">${s.codigo_producto}</small>` : ''}
                    </td>
                    <td>
                        <span style="background:#dc3545; color:white; padding: 2px 8px; border-radius: 4px; font-weight:bold;">
                            -${s.cantidad}
                        </span>
                    </td>
                    <td>${s.destino || s.tipo_salida || '-'}</td>
                    <td>${fechaFormateada}</td>
                    <td>${s.observacion || s.motivo || '-'}</td>
                    <td>
                        <button class="btn-secondary" onclick="verDetalleSalida(${s.id_salida})">Ver</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error cargando salidas:", error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty" style="color:red;">Error al cargar las salidas.</td></tr>';
    }
}

// 2. Cargar lista de productos con stock actualizado
async function cargarProductos() {
    const selectProd = document.getElementById("id_producto");
    if (!selectProd) return;

    try {
        const respuesta = await fetch("/api/productos/");
        if (!respuesta.ok) return;

        const productos = await respuesta.json();
        selectProd.innerHTML = '<option value="">Selecciona un producto</option>' +
            productos.map(p => `<option value="${p.id_producto}">${p.nombre} (${p.codigo || 'Sin código'}) - Stock: ${p.stock}</option>`).join('');
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

// 3. Controles para Abrir y Cerrar Modal
function abrirModalNuevo() {
    const form = document.getElementById("formSalida");
    const modal = document.getElementById("modalSalida");

    if (form) form.reset();
    if (modal) {
        modal.style.display = "flex";
        modal.classList.remove("hidden");
    }
}

function cerrarModal() {
    const modal = document.getElementById("modalSalida");
    if (modal) {
        modal.style.display = "none";
        modal.classList.add("hidden");
    }
}

// 4. Guardar una nueva salida (POST)
async function guardarSalida(event) {
    event.preventDefault();

    const id_producto = document.getElementById("id_producto")?.value;
    const cantidad = parseInt(document.getElementById("cantidad")?.value) || 1;
    const tipo_salida = document.getElementById("tipo_salida")?.value;
    const destino = document.getElementById("destino")?.value.trim();
    const observacion = document.getElementById("observacion")?.value.trim();

    // Validaciones básicas en frontend
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
        tipo_salida: tipo_salida,
        destino: destino,
        observacion: observacion
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
                text: resultado.mensaje || "Se ha descontado el stock correctamente.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });

            cerrarModal();
            cargarSalidas();
            cargarProductos(); // Importante: recarga la lista para mostrar los stocks restados
        } else {
            Swal.fire("Error", resultado.error || "No se pudo registrar la salida.", "error");
        }
    } catch (error) {
        console.error("Error al registrar salida:", error);
        Swal.fire("Error", "Error de comunicación con el servidor.", "error");
    }
}

// 5. Ver detalle individual de una salida
async function verDetalleSalida(id_salida) {
    try {
        const respuesta = await fetch(`/api/salidas/${id_salida}`);
        if (!respuesta.ok) {
            Swal.fire("Error", "No se pudo obtener el detalle de la salida.", "error");
            return;
        }
        const detalle = await respuesta.json();

        Swal.fire({
            title: `Detalle de Salida #${id_salida}`,
            html: `
                <div style="text-align: left; line-height: 1.8;">
                    <p><strong>Producto:</strong> ${detalle.producto || '-'}</p>
                    <p><strong>Cantidad:</strong> ${detalle.cantidad}</p>
                    <p><strong>Tipo:</strong> ${detalle.tipo_salida || '-'}</p>
                    <p><strong>Destino:</strong> ${detalle.destino || '-'}</p>
                    <p><strong>Fecha:</strong> ${detalle.fecha ? new Date(detalle.fecha).toLocaleString() : '-'}</p>
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