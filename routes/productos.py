from flask import Blueprint, jsonify, request
from extensions import mysql

productos_bp = Blueprint("productos", __name__)

# 1. OBTENER TODOS LOS PRODUCTOS
@productos_bp.route("/", methods=["GET"])
def obtener_productos():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT 
                p.id_producto, p.codigo, p.nombre, p.descripcion, 
                p.marca, p.modelo, p.stock, p.stock_minimo, 
                p.id_categoria, c.nombre AS categoria
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            ORDER BY p.id_producto DESC
        """)
        columnas = [col[0] for col in cursor.description]
        productos = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
        cursor.close()
        return jsonify(productos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 2. AGREGAR PRODUCTO (POST)
@productos_bp.route("/", methods=["POST"])
def agregar_producto():
    try:
        datos = request.get_json()
        
        # Validar campos obligatorios
        if not datos or "nombre" not in datos:
            return jsonify({"error": "El nombre del producto es obligatorio"}), 400

        cursor = mysql.connection.cursor()
        query = """
            INSERT INTO productos (
                codigo, nombre, descripcion, marca, modelo, 
                id_categoria, stock, stock_minimo
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        valores = (
            datos.get("codigo"),
            datos.get("nombre"),
            datos.get("descripcion"),
            datos.get("marca"),
            datos.get("modelo"),
            datos.get("id_categoria"),
            datos.get("stock", 0),
            datos.get("stock_minimo", 0)
        )
        
        cursor.execute(query, valores)
        mysql.connection.commit()
        id_nuevo = cursor.lastrowid
        cursor.close()

        return jsonify({
            "mensaje": "Producto creado exitosamente",
            "id_producto": id_nuevo
        }), 201

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500


# 3. EDITAR PRODUCTO (PUT)
@productos_bp.route("/<int:id_producto>", methods=["PUT"])
def editar_producto(id_producto):
    try:
        datos = request.get_json()

        cursor = mysql.connection.cursor()
        
        # Verificar si existe el producto
        cursor.execute("SELECT id_producto FROM productos WHERE id_producto = %s", (id_producto,))
        if not cursor.fetchone():
            cursor.close()
            return jsonify({"error": "Producto no encontrado"}), 404

        query = """
            UPDATE productos 
            SET codigo = %s,
                nombre = %s,
                descripcion = %s,
                marca = %s,
                modelo = %s,
                id_categoria = %s,
                stock = %s,
                stock_minimo = %s
            WHERE id_producto = %s
        """
        valores = (
            datos.get("codigo"),
            datos.get("nombre"),
            datos.get("descripcion"),
            datos.get("marca"),
            datos.get("modelo"),
            datos.get("id_categoria"),
            datos.get("stock"),
            datos.get("stock_minimo"),
            id_producto
        )

        cursor.execute(query, valores)
        mysql.connection.commit()
        cursor.close()

        return jsonify({"mensaje": "Producto actualizado correctamente"}), 200

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500


# 4. ELIMINAR PRODUCTO (DELETE)
@productos_bp.route("/<int:id_producto>", methods=["DELETE"])
def eliminar_producto(id_producto):
    try:
        cursor = mysql.connection.cursor()
        
        # Verificar si el producto existe
        cursor.execute("SELECT id_producto FROM productos WHERE id_producto = %s", (id_producto,))
        if not cursor.fetchone():
            cursor.close()
            return jsonify({"error": "Producto no encontrado"}), 404

        cursor.execute("DELETE FROM productos WHERE id_producto = %s", (id_producto,))
        mysql.connection.commit()
        cursor.close()

        return jsonify({"mensaje": "Producto eliminado correctamente"}), 200

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": "No se puede eliminar el producto porque tiene movimientos o registros asociados."}), 500

@productos_bp.route("/<int:id_producto>", methods=["GET"])
def obtener_producto(id_producto):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM productos WHERE id_producto = %s", (id_producto,))
        fila = cursor.fetchone()
        cursor.close()

        if not fila:
            return jsonify({"error": "Producto no encontrado"}), 404

        columnas = [col[0] for col in cursor.description]
        return jsonify(dict(zip(columnas, fila))), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500