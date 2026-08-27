document.addEventListener("DOMContentLoaded", () => {
    cargarCategorias();
    document.getElementById("formCrearProducto")?.addEventListener("submit", guardarProducto);
});

async function cargarCategorias() {
    try {
        const respuesta = await fetch("/api/categorias/");
        if (respuesta.ok) {
            const categorias = await respuesta.json();
            const selectCat = document.getElementById("id_categoria");
            selectCat.innerHTML = '<option value="">Selecciona una categoría</option>';
            categorias.forEach(c => {
                selectCat.innerHTML += `<option value="${c.id_categoria}">${c.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

async function guardarProducto(event) {
    event.preventDefault();

    const datos = {
        codigo: document.getElementById("codigo").value,
        nombre: document.getElementById("nombre").value,
        id_categoria: document.getElementById("id_categoria").value,
        marca: document.getElementById("marca").value,
        modelo: document.getElementById("modelo").value,
        stock: parseInt(document.getElementById("stock").value) || 0,
        stock_minimo: parseInt(document.getElementById("stock_minimo").value) || 0,
        descripcion: document.getElementById("descripcion").value
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
                text: "El producto se ha registrado correctamente.",
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