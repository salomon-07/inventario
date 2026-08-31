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
                p.id_categoria, c.nombre AS categoria,
                cp.id_caja
            FROM productos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN caja_productos cp ON p.id_producto = cp.id_producto
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
        id_nuevo = cursor.lastrowid

        # Insertar en tabla caja_productos si se seleccionó una caja
        id_caja = datos.get("id_caja")
        stock = int(datos.get("stock", 0))

        if id_caja is not None and str(id_caja).strip() not in ["", "null", "None", "0"]:
            cantidad_asignada = stock if stock > 0 else 1
            cursor.execute("""
                INSERT INTO caja_productos (id_caja, id_producto, cantidad)
                VALUES (%s, %s, %s)
            """, (int(id_caja), id_nuevo, cantidad_asignada))

        mysql.connection.commit()
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

        # Actualizar la asignación en caja_productos si se envía id_caja
        id_caja = datos.get("id_caja")
        if id_caja is not None:
            cursor.execute("DELETE FROM caja_productos WHERE id_producto = %s", (id_producto,))
            if str(id_caja).strip() not in ["", "null", "None", "0"]:
                stock = int(datos.get("stock", 0))
                cursor.execute("""
                    INSERT INTO caja_productos (id_caja, id_producto, cantidad)
                    VALUES (%s, %s, %s)
                """, (int(id_caja), id_producto, stock if stock > 0 else 1))

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
        
        cursor.execute("SELECT id_producto FROM productos WHERE id_producto = %s", (id_producto,))
        if not cursor.fetchone():
            cursor.close()
            return jsonify({"error": "Producto no encontrado"}), 404

        # Eliminar primero las referencias en caja_productos para evitar fallos de llave foránea
        cursor.execute("DELETE FROM caja_productos WHERE id_producto = %s", (id_producto,))
        cursor.execute("DELETE FROM productos WHERE id_producto = %s", (id_producto,))
        
        mysql.connection.commit()
        cursor.close()

        return jsonify({"mensaje": "Producto eliminado correctamente"}), 200

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": "No se puede eliminar el producto porque tiene movimientos o registros asociados."}), 500


# 5. OBTENER UN PRODUCTO (GET)
@productos_bp.route("/<int:id_producto>", methods=["GET"])
def obtener_producto(id_producto):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT p.*, cp.id_caja 
            FROM productos p 
            LEFT JOIN caja_productos cp ON p.id_producto = cp.id_producto 
            WHERE p.id_producto = %s
        """, (id_producto,))
        fila = cursor.fetchone()
        
        if not fila:
            cursor.close()
            return jsonify({"error": "Producto no encontrado"}), 404

        columnas = [col[0] for col in cursor.description]
        producto = dict(zip(columnas, fila))
        cursor.close()

        return jsonify(producto), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500