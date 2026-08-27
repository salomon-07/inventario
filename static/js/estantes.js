document.addEventListener("DOMContentLoaded", () => {
    cargarEstantes();
});

async function cargarEstantes() {
    try {
        const respuesta = await fetch("/api/estantes/");
        if (respuesta.ok) {
            const estantes = await respuesta.json();
            const tbody = document.getElementById("tablaEstantes");
            if (!tbody) return;

            if (estantes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="empty">No hay estantes registrados</td></tr>';
                return;
            }

            tbody.innerHTML = estantes.map(e => `
                <tr>
                    <td>${e.id_estante}</td>
                    <td>${e.nombre}</td>
                    <td>${e.ubicacion || '-'}</td>
                    <td>${e.descripcion || '-'}</td>
                    <td>${e.estado || 'Activo'}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error("Error cargando estantes:", error);
    }
}