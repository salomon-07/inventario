document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    cargarEstadisticas();
    cargarUltimosMovimientos();
    const formProducto = document.getElementById("formProducto");
    if (formProducto) {
        formProducto.addEventListener("submit", guardarProducto);
    }
});
async function cargarEstadisticas() {
    try {
        const respuesta = await fetch("/api/stats");
        
        if (!respuesta.ok) {
            console.error("Error en la respuesta del servidor:", respuesta.status);
            return;
        }

        const data = await respuesta.json();
        console.log("Datos recibidos de /api/stats:", data); // Ver en F12 -> Console

        // Asignación con respaldo a '0'
        document.getElementById("totalProductos").textContent = data.total_productos ?? 0;
        document.getElementById("totalStock").textContent = data.total_stock ?? 0;
        document.getElementById("totalCajas").textContent = data.total_cajas ?? 0;

    } catch (error) {
        console.error("Error al conectar con la API:", error);
    }
}
// 1. CARGAR PRODUCTOS
async function cargarProductos() {
    const tabla = document.getElementById("tablaProductos");
    if (!tabla) return;

    try {
        const respuesta = await fetch("/api/productos/");
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

        const productos = await respuesta.json();
        tabla.innerHTML = "";

        if (!Array.isArray(productos) || productos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="8">No hay productos registrados.</td></tr>`;
            return;
        }

        productos.forEach(producto => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${producto.codigo ?? ""}</td>
                <td>${producto.nombre ?? ""}</td>
                <td>${producto.categoria ?? "Sin categoría"}</td>
                <td>${producto.marca ?? ""}</td>
                <td>${producto.modelo ?? ""}</td>
                <td>${producto.stock ?? 0}</td>
                <td>${producto.stock_minimo ?? 0}</td>
                <td>
                    <button class="btn-editar" onclick='prepararEdicion(${JSON.stringify(producto)})'>
                        Editar
                    </button>
                    <button class="btn-eliminar" onclick="eliminarProducto(${producto.id_producto})">
                        Eliminar
                    </button>
                </td>
            `;
            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error("Error cargando productos:", error);
        tabla.innerHTML = `<tr><td colspan="8">Error al cargar los productos.</td></tr>`;
    }
}

// 2. CONTROL DEL MODAL
function abrirModalNuevo() {
    document.getElementById("formProducto")?.reset();
    document.getElementById("id_producto").value = "";
    document.getElementById("tituloModal").textContent = "Nuevo Producto";
    document.getElementById("modalProducto").style.display = "flex";
}

function prepararEdicion(producto) {
    document.getElementById("id_producto").value = producto.id_producto;
    document.getElementById("codigo").value = producto.codigo ?? "";
    document.getElementById("nombre").value = producto.nombre ?? "";
    document.getElementById("marca").value = producto.marca ?? "";
    document.getElementById("modelo").value = producto.modelo ?? "";
    document.getElementById("id_categoria").value = producto.id_categoria ?? "";
    document.getElementById("stock").value = producto.stock ?? 0;
    document.getElementById("stock_minimo").value = producto.stock_minimo ?? 0;
    document.getElementById("descripcion").value = producto.descripcion ?? "";

    document.getElementById("tituloModal").textContent = "Editar Producto";
    document.getElementById("modalProducto").style.display = "flex";
}

function cerrarModal() {
    document.getElementById("modalProducto").style.display = "none";
}

// 3. GUARDAR (CREAR / EDITAR DENTRO DEL MODAL)
async function guardarProducto(event) {
    event.preventDefault();

    const idProducto = document.getElementById("id_producto")?.value;

    const datos = {
        codigo: document.getElementById("codigo")?.value || "",
        nombre: document.getElementById("nombre")?.value || "",
        descripcion: document.getElementById("descripcion")?.value || "",
        marca: document.getElementById("marca")?.value || "",
        modelo: document.getElementById("modelo")?.value || "",
        id_categoria: document.getElementById("id_categoria")?.value || null,
        stock: parseInt(document.getElementById("stock")?.value || 0),
        stock_minimo: parseInt(document.getElementById("stock_minimo")?.value || 0)
    };

    const esEdicion = Boolean(idProducto);
    const url = esEdicion ? `/api/productos/${idProducto}` : "/api/productos/";
    const metodo = esEdicion ? "PUT" : "POST";

    try {
        const respuesta = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            cerrarModal();
            await Swal.fire({
                title: "¡Éxito!",
                text: resultado.mensaje || "Registro guardado exitosamente.",
                icon: "success"
            });
            cargarProductos();
        } else {
            Swal.fire({
                title: "Error",
                text: resultado.error || "No se pudo guardar la información.",
                icon: "error"
            });
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        Swal.fire({
            title: "Error de servidor",
            text: "Ocurrió un problema de red o con el servidor.",
            icon: "error"
        });
    }
}

// 4. ELIMINAR PRODUCTO
async function eliminarProducto(id) {
    const confirmacion = await Swal.fire({
        title: "¿Estás seguro?",
        text: "¡No podrás revertir esta acción!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (confirmacion.isConfirmed) {
        try {
            const respuesta = await fetch(`/api/productos/${id}`, { method: "DELETE" });
            const resultado = await respuesta.json();

            if (respuesta.ok) {
                await Swal.fire({
                    title: "¡Eliminado!",
                    text: resultado.mensaje || "El producto ha sido eliminado correctamente.",
                    icon: "success"
                });
                cargarProductos();
            } else {
                Swal.fire({
                    title: "Error",
                    text: resultado.error || "No se pudo eliminar el producto.",
                    icon: "error"
                });
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            Swal.fire({
                title: "Error de servidor",
                text: "Ocurrió un problema al intentar eliminar el producto.",
                icon: "error"
            });
        }
    }
}