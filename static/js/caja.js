document.addEventListener("DOMContentLoaded", () => {
    cargarCajas();

    const btnBuscar = document.getElementById("btnBuscarCaja");
    if (btnBuscar) {
        btnBuscar.addEventListener("click", () => {
            const codigo = document.getElementById("codigoCaja").value.trim();
            if (codigo) verDetalleCaja(codigo);
        });
    }
});

async function cargarCajas() {
    const tbody = document.getElementById("tablaCajas");
    if (!tbody) return;

    try {
        const res = await fetch("/api/cajas");
        if (!res.ok) throw new Error("Error al obtener cajas");
        const cajas = await res.json();

        if (cajas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay cajas registradas</td></tr>';
            return;
        }

        tbody.innerHTML = cajas.map(c => {
            const identificador = c.codigo_qr || c.id_caja;
            return `
                <tr>
                    <td><strong>${c.codigo_qr || '-'}</strong></td>
                    <td>${c.nombre || 'Caja sin nombre'}</td>
                    <td>${c.estante || 'Sin asignar'}</td>
                    <td>${c.total_items || 0} ítems</td>
                    <td><span class="badge">${c.estado || 'Activa'}</span></td>
                    <td>
                        <button type="button" onclick="verDetalleCaja('${identificador}')" class="btn-primary" style="padding: 4px 8px; font-size: 12px;">
                            Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Error al cargar cajas:", err);
        tbody.innerHTML = '<tr><td colspan="6" class="empty">Error al cargar la tabla</td></tr>';
    }
}

async function verDetalleCaja(codigo) {
    if (!codigo || codigo === 'undefined') {
        alert("El código de la caja no es válido");
        return;
    }

    try {
        const res = await fetch(`/api/cajas/detalle/${encodeURIComponent(codigo)}`);
        
        if (!res.ok) {
            alert("No se encontró información para la caja: " + codigo);
            return;
        }

        const data = await res.json();

        // 1. Cabecera de la caja
        document.getElementById("nombreCaja").textContent = data.nombre;
        document.getElementById("codigoCajaResultado").textContent = `Código: ${data.codigo_qr}`;
        document.getElementById("estanteCaja").textContent = `Estante: ${data.estante}`;
        document.getElementById("estadoCaja").textContent = data.estado;

        // 2. Tabla del contenido
        const tbodyContenido = document.getElementById("contenidoCaja");
        
        if (!data.productos || data.productos.length === 0) {
            tbodyContenido.innerHTML = '<tr><td colspan="5" class="empty">Esta caja no tiene productos asignados</td></tr>';
        } else {
            tbodyContenido.innerHTML = data.productos.map(p => `
                <tr>
                    <td>${p.codigo || '-'}</td>
                    <td>${p.nombre}</td>
                    <td>${p.marca}</td>
                    <td>${p.modelo}</td>
                    <td><strong>${p.cantidad}</strong></td>
                </tr>
            `).join('');
        }

        // 3. Mostrar bloque
        const contenedor = document.getElementById("cajaEncontrada");
        contenedor.classList.remove("hidden");
        contenedor.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (err) {
        console.error("Error al consultar el detalle de la caja:", err);
    }
}