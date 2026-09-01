document.addEventListener("DOMContentLoaded", () => {
    cargarMovimientos();
    cargarProductosSelect();
    cargarCajasSelect();

    const form = document.getElementById("formMovimiento");
    if (form) {
        form.addEventListener("submit", guardarMovimiento);
    }
});

// 1. Cargar la tabla de movimientos desde la API
async function cargarMovimientos() {
    const tbody = document.getElementById("tablaMovimientos");
    if (!tbody) return;

    try {
        const respuesta = await fetch("/api/movimientos/");
        if (!respuesta.ok) throw new Error("Error al obtener los movimientos");

        const movimientos = await respuesta.json();

        if (movimientos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty">No hay movimientos registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = movimientos.map(m => {
            const fechaFormateada = m.fecha ? new Date(m.fecha).toLocaleString() : "-";
            const cajaNombre = m.codigo_caja ? `Caja: ${m.codigo_caja}` : "-";
            
            let badgeColor = "#17a2b8";
            if (m.tipo === "ENTRADA") badgeColor = "#28a745";
            if (m.tipo === "SALIDA") badgeColor = "#dc3545";
            if (m.tipo === "AJUSTE") badgeColor = "#ffc107";

            return `
                <tr>
                    <td>${fechaFormateada}</td>
                    <td><strong>${m.producto || "-"}</strong> <br><small style="color:#666">${m.codigo_producto || ""}</small></td>
                    <td>${cajaNombre}</td>
                    <td><span style="background:${badgeColor}; color:white; padding: 2px 8px; border-radius: 4px; font-size:0.85em; font-weight:bold;">${m.tipo}</span></td>
                    <td><strong>${m.cantidad}</strong></td>
                    <td>${m.stock_anterior} ➔ <strong>${m.stock_nuevo}</strong></td>
                    <td>${m.motivo || "-"}</td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Error al cargar movimientos:", error);
        tbody.innerHTML = `<tr><td colspan="7" class="empty" style="color:red;">Error al cargar datos.</td></tr>`;
    }
}

// 2. Cargar productos en el select del formulario
async function cargarProductosSelect() {
    const select = document.getElementById("id_producto");
    if (!select) return;

    try {
        const respuesta = await fetch("/api/productos/");
        if (!respuesta.ok) return;

        const productos = await respuesta.json();
        select.innerHTML = `<option value="">Selecciona un producto</option>` +
            productos.map(p => `<option value="${p.id_producto}">${p.nombre} (${p.codigo || 'Sin código'}) - Stock: ${p.stock}</option>`).join("");
    } catch (error) {
        console.error("Error al cargar productos:", error);
    }
}

// 3. Cargar cajas en el select del formulario
async function cargarCajasSelect() {
    const select = document.getElementById("id_caja");
    if (!select) return;

    try {
        const respuesta = await fetch("/api/cajas");
        if (!respuesta.ok) return;

        const cajas = await respuesta.json();
        select.innerHTML = `<option value="">Sin caja asignada</option>` +
            cajas.map(c => `<option value="${c.id_caja}">${c.nombre} (${c.codigo_qr || 'Sin QR'})</option>`).join("");
    } catch (error) {
        console.error("Error al cargar cajas:", error);
    }
}

// 4. Guardar un nuevo movimiento (POST)
async function guardarMovimiento(e) {
    e.preventDefault();

    const id_producto = document.getElementById("id_producto").value;
    const tipo = document.getElementById("tipo").value;
    const cantidad = parseInt(document.getElementById("cantidad").value);
    const id_caja_val = document.getElementById("id_caja").value;
    const id_caja = id_caja_val ? parseInt(id_caja_val) : null;
    const motivo = document.getElementById("motivo").value.trim();

    if (!id_producto || !tipo || !cantidad) {
        Swal.fire("Atención", "Producto, tipo y cantidad son obligatorios", "warning");
        return;
    }

    try {
        const respuesta = await fetch("/api/movimientos/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_producto: parseInt(id_producto),
                id_caja: id_caja,
                tipo: tipo,
                cantidad: cantidad,
                motivo: motivo
            })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            Swal.fire("¡Éxito!", resultado.mensaje || "Movimiento registrado", "success");
            cerrarModal();
            cargarMovimientos();
            cargarProductosSelect(); // Actualiza stocks en el dropdown
        } else {
            Swal.fire("Error", resultado.error || "No se pudo registrar el movimiento", "error");
        }
    } catch (error) {
        console.error("Error al guardar movimiento:", error);
        Swal.fire("Error", "Ocurrió un fallo en el servidor", "error");
    }
}

// 5. Controles de Modal
function abrirModalNuevo() {
    const modal = document.getElementById("modalMovimiento");
    const form = document.getElementById("formMovimiento");

    if (form) form.reset();
    if (modal) {
        modal.style.display = "flex";
        modal.classList.remove("hidden");
    }
}

function cerrarModal() {
    const modal = document.getElementById("modalMovimiento");
    if (modal) {
        modal.style.display = "none";
        modal.classList.add("hidden");
    }
}