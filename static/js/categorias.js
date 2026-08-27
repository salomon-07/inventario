document.addEventListener("DOMContentLoaded", () => {
    cargarCategorias();

    const formCategoria = document.getElementById("formCategoria");
    if (formCategoria) {
        formCategoria.addEventListener("submit", guardarCategoria);
    }
});

// 1. CARGAR CATEGORÍAS
async function cargarCategorias() {
    const tabla = document.getElementById("tablaCategorias");
    if (!tabla) return;

    try {
        const respuesta = await fetch("/api/categorias/");
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

        const categorias = await respuesta.json();
        tabla.innerHTML = "";

        if (!Array.isArray(categorias) || categorias.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="3">No hay categorías registradas.</td>
                </tr>
            `;
            return;
        }

        categorias.forEach(cat => {
            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${cat.nombre ?? ""}</td>
                <td>${cat.descripcion ?? "Sin descripción"}</td>
                <td>
                    <button class="btn-editar" onclick='prepararEdicion(${JSON.stringify(cat)})'>
                        Editar
                    </button>
                    <button class="btn-eliminar" onclick="eliminarCategoria(${cat.id_categoria})">
                        Eliminar
                    </button>
                </td>
            `;

            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error("Error cargando categorías:", error);
        tabla.innerHTML = `
            <tr>
                <td colspan="3">Error al cargar las categorías.</td>
            </tr>
        `;
    }
}

// 2. CONTROL DEL MODAL
function abrirModalNuevo() {
    document.getElementById("formCategoria")?.reset();
    const inputId = document.getElementById("id_categoria");
    if (inputId) inputId.value = "";
    
    document.getElementById("tituloModal").textContent = "Nueva Categoría";
    document.getElementById("modalCategoria").style.display = "flex";
}

function prepararEdicion(categoria) {
    document.getElementById("id_categoria").value = categoria.id_categoria;
    document.getElementById("nombre").value = categoria.nombre ?? "";
    document.getElementById("descripcion").value = categoria.descripcion ?? "";

    document.getElementById("tituloModal").textContent = "Editar Categoría";
    document.getElementById("modalCategoria").style.display = "flex";
}

function cerrarModal() {
    document.getElementById("modalCategoria").style.display = "none";
}

// 3. GUARDAR (POST PARA NUEVA / PUT PARA EDITAR)
async function guardarCategoria(event) {
    event.preventDefault();

    const idCategoria = document.getElementById("id_categoria")?.value;

    const datos = {
        nombre: document.getElementById("nombre")?.value || "",
        descripcion: document.getElementById("descripcion")?.value || ""
    };

    const esEdicion = Boolean(idCategoria);
    const url = esEdicion ? `/api/categorias/${idCategoria}` : "/api/categorias/";
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
                text: resultado.mensaje || "Categoría guardada correctamente.",
                icon: "success"
            });
            cargarCategorias();
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

// 4. ELIMINAR CATEGORÍA
async function eliminarCategoria(id) {
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
            const respuesta = await fetch(`/api/categorias/${id}`, {
                method: "DELETE"
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                await Swal.fire({
                    title: "¡Eliminada!",
                    text: resultado.mensaje || "La categoría ha sido eliminada correctamente.",
                    icon: "success"
                });
                cargarCategorias();
            } else {
                Swal.fire({
                    title: "Error",
                    text: resultado.error || "No se pudo eliminar la categoría.",
                    icon: "error"
                });
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            Swal.fire({
                title: "Error de servidor",
                text: "Ocurrió un problema al intentar eliminar la categoría.",
                icon: "error"
            });
        }
    }
}