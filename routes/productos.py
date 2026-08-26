from flask import Blueprint, jsonify, current_app

productos_bp = Blueprint("productos", __name__, url_prefix="/api/productos")


@productos_bp.route("/", methods=["GET"])
def obtener_productos():
    try:
        mysql = current_app.extensions["mysql"]
        cursor = mysql.connection.cursor()

        cursor.execute("""
            SELECT
                p.id_producto,
                p.codigo,
                p.nombre,
                p.descripcion,
                p.marca,
                p.modelo,
                p.stock,
                p.stock_minimo,
                c.nombre AS categoria
            FROM productos p
            LEFT JOIN categorias c
                ON p.id_categoria = c.id_categoria
            ORDER BY p.id_producto DESC
        """)

        columnas = [columna[0] for columna in cursor.description]
        productos = [
            dict(zip(columnas, fila))
            for fila in cursor.fetchall()
        ]

        cursor.close()

        return jsonify(productos), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500