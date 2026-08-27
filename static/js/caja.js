document.addEventListener("DOMContentLoaded", () => {
    cargarCajas();
    document.getElementById("btnBuscarCaja")?.addEventListener("click", buscarCaja);
});

async function cargarCajas() {
    try {
        const respuesta = await fetch("/api/cajas/");
        if (respuesta.ok) {
            const cajas = await respuesta.json();
            const tbody = document.getElementById("tablaCajas");
            if (!tbody) return;

            if (cajas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay cajas registradas</td></tr>';
                return;
            }

            tbody.innerHTML = cajas.map(c => `
                <tr>
                    <td>${c.codigo_qr || '-'}</td>
                    <td>${c.nombre}</td>
                    <td>${c.estante || c.id_estante || '-'}</td>
                    <td>${c.total_productos ?? 0} productos</td>
                    <td>${c.estado || 'Disponible'}</td>
                    <td>
                        <button class="btn-secondary" onclick="consultarCajaDirecta('${c.codigo_qr}')">Ver</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error("Error cargando cajas:", error);
    }
}

async function buscarCaja() {
    const codigo = document.getElementById("codigoCaja").value.trim();
    if (!codigo) return;
    await consultarCajaDirecta(codigo);
}

async function consultarCajaDirecta(codigo) {
    try {
        const respuesta = await fetch(`/api/cajas/${codigo}`);
        if (respuesta.ok) {
            const caja = await respuesta.json();
            
            document.getElementById("nombreCaja").textContent = caja.nombre;
            document.getElementById("codigoCajaResultado").textContent = `Código: ${caja.codigo_qr || '-'}`;
            document.getElementById("estanteCaja").textContent = `Estante: ${caja.estante || '-'}`;
            document.getElementById("estadoCaja").textContent = caja.estado || '-';

            const tbodyContenido = document.getElementById("contenidoCaja");
            if (caja.productos && caja.productos.length > 0) {
                tbodyContenido.innerHTML = caja.productos.map(p => `
                    <tr>
                        <td>${p.codigo || '-'}</td>
                        <td>${p.nombre}</td>
                        <td>${p.marca || '-'}</td>
                        <td>${p.modelo || '-'}</td>
                        <td>${p.cantidad}</td>
                    </tr>
                `).join('');
            } else {
                tbodyContenido.innerHTML = '<tr><td colspan="5">Sin productos asignados</td></tr>';
            }

            document.getElementById("cajaEncontrada").classList.remove("hidden");
        } else {
            Swal.fire("No encontrada", "No se encontró ninguna caja con ese código", "warning");
        }
    } catch (error) {
        console.error("Error al buscar la caja:", error);
    }
}