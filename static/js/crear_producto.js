document.addEventListener("DOMContentLoaded", () => {
    cargarCategorias();
    cargarCajas();
    document.getElementById("formCrearProducto")?.addEventListener("submit", guardarProducto);
});

async function cargarCategorias() {
    const selectCat = document.getElementById("id_categoria");
    if (!selectCat) return;

    try {
        const respuesta = await fetch("/api/categorias");
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const categorias = await respuesta.json();
        let opciones = '<option value="">Selecciona una categoría</option>';

        categorias.forEach(c => {
            opciones += `<option value="${c.id_categoria}">${c.nombre}</option>`;
        });

        selectCat.innerHTML = opciones;
    } catch (error) {
        console.error("Error cargando categorías:", error);
        selectCat.innerHTML = '<option value="">Error al cargar categorías</option>';
    }
}

async function cargarCajas() {
    const selectCaja = document.getElementById("id_caja");
    if (!selectCaja) return;

    try {
        const respuesta = await fetch("/api/cajas");
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const cajas = await respuesta.json();
        let opciones = '<option value="">Sin asignación (Sin caja)</option>';

        cajas.forEach(c => {
            const nombreCaja = c.nombre ? `${c.nombre} (${c.codigo_qr})` : c.codigo_qr;
            opciones += `<option value="${c.id_caja}">${nombreCaja}</option>`;
        });

        selectCaja.innerHTML = opciones;
    } catch (error) {
        console.error("Error cargando cajas:", error);
        selectCaja.innerHTML = '<option value="">Error al cargar cajas</option>';
    }
}

async function guardarProducto(event) {
    event.preventDefault();

    const selectCajaElem = document.getElementById("id_caja");
    const idCajaValor = selectCajaElem ? selectCajaElem.value : "";

    const datos = {
        codigo: document.getElementById("codigo").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        id_categoria: document.getElementById("id_categoria").value,
        id_caja: idCajaValor !== "" ? parseInt(idCajaValor) : null,
        marca: document.getElementById("marca").value.trim(),
        modelo: document.getElementById("modelo").value.trim(),
        stock: parseInt(document.getElementById("stock").value) || 0,
        stock_minimo: parseInt(document.getElementById("stock_minimo").value) || 0,
        descripcion: document.getElementById("descripcion").value.trim()
    };

    try {
        const respuesta = await fetch("/api/productos/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            await Swal.fire({
                title: "¡Producto creado!",
                text: "El producto se ha registrado y asignado correctamente.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
            window.location.href = "/productos";
        } else {
            Swal.fire("Error", resultado.error || "No se pudo crear el producto.", "error");
        }
    } catch (error) {
        Swal.fire("Error", "Error de comunicación con el servidor.", "error");
    }
}