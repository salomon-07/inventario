from flask import Blueprint, request, jsonify
from flask_mysqldb import MySQL

productos_bp = Blueprint(
    'productos',
    __name__
)


@productos_bp.route('/', methods=['GET'])
def obtener_productos():

    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT
            p.id_producto,
            p.codigo,
            p.nombre,
            p.descripcion,
            p.id_categoria,
            c.nombre,
            p.stock,
            p.stock_minimo,
            p.fecha_registro
        FROM productos p
        INNER JOIN categorias c
            ON p.id_categoria = c.id_categoria
        ORDER BY p.nombre
    """)

    productos = cursor.fetchall()

    cursor.close()

    resultado = []

    for producto in productos:

        resultado.append({
            'id_producto': producto[0],
            'codigo': producto[1],
            'nombre': producto[2],
            'descripcion': producto[3],
            'id_categoria': producto[4],
            'categoria': producto[5],
            'stock': producto[6],
            'stock_minimo': producto[7],
            'fecha_registro': producto[8].isoformat()
                if producto[8] else None
        })

    return jsonify(resultado)


@productos_bp.route('/', methods=['POST'])
def crear_producto():

    datos = request.get_json()

    codigo = datos.get('codigo')
    nombre = datos.get('nombre')
    descripcion = datos.get('descripcion')
    id_categoria = datos.get('id_categoria')
    stock = datos.get('stock', 0)
    stock_minimo = datos.get('stock_minimo', 1)

    if not codigo or not nombre or not id_categoria:
        return jsonify({
            'error': 'Código, nombre y categoría son obligatorios'
        }), 400

    cursor = mysql.connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO productos
            (
                codigo,
                nombre,
                descripcion,
                id_categoria,
                stock,
                stock_minimo
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            codigo,
            nombre,
            descripcion,
            id_categoria,
            stock,
            stock_minimo
        ))

        mysql.connection.commit()

        return jsonify({
            'mensaje': 'Producto creado correctamente',
            'id_producto': cursor.lastrowid
        }), 201

    except Exception as e:

        mysql.connection.rollback()

        return jsonify({
            'error': str(e)
        }), 500

    finally:
        cursor.close()


@productos_bp.route('/codigo/<string:codigo>', methods=['GET'])
def buscar_por_codigo(codigo):

    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT
            p.id_producto,
            p.codigo,
            p.nombre,
            p.descripcion,
            c.nombre,
            p.stock,
            p.stock_minimo
        FROM productos p
        INNER JOIN categorias c
            ON p.id_categoria = c.id_categoria
        WHERE p.codigo = %s
    """, (codigo,))

    producto = cursor.fetchone()

    cursor.close()

    if not producto:
        return jsonify({
            'error': 'Producto no encontrado'
        }), 404

    return jsonify({
        'id_producto': producto[0],
        'codigo': producto[1],
        'nombre': producto[2],
        'descripcion': producto[3],
        'categoria': producto[4],
        'stock': producto[5],
        'stock_minimo': producto[6]
    })


@productos_bp.route('/<int:id_producto>', methods=['GET'])
def obtener_producto(id_producto):

    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT
            p.id_producto,
            p.codigo,
            p.nombre,
            p.descripcion,
            p.id_categoria,
            c.nombre,
            p.stock,
            p.stock_minimo,
            p.fecha_registro
        FROM productos p
        INNER JOIN categorias c
            ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = %s
    """, (id_producto,))

    producto = cursor.fetchone()

    cursor.close()

    if not producto:
        return jsonify({
            'error': 'Producto no encontrado'
        }), 404

    return jsonify({
        'id_producto': producto[0],
        'codigo': producto[1],
        'nombre': producto[2],
        'descripcion': producto[3],
        'id_categoria': producto[4],
        'categoria': producto[5],
        'stock': producto[6],
        'stock_minimo': producto[7],
        'fecha_registro': producto[8].isoformat()
            if producto[8] else None
    })


@productos_bp.route('/<int:id_producto>', methods=['PUT'])
def actualizar_producto(id_producto):

    datos = request.get_json()

    codigo = datos.get('codigo')
    nombre = datos.get('nombre')
    descripcion = datos.get('descripcion')
    id_categoria = datos.get('id_categoria')
    stock_minimo = datos.get('stock_minimo')

    cursor = mysql.connection.cursor()

    try:

        cursor.execute("""
            UPDATE productos
            SET
                codigo = %s,
                nombre = %s,
                descripcion = %s,
                id_categoria = %s,
                stock_minimo = %s
            WHERE id_producto = %s
        """, (
            codigo,
            nombre,
            descripcion,
            id_categoria,
            stock_minimo,
            id_producto
        ))

        mysql.connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                'error': 'Producto no encontrado'
            }), 404

        return jsonify({
            'mensaje': 'Producto actualizado correctamente'
        })

    except Exception as e:

        mysql.connection.rollback()

        return jsonify({
            'error': str(e)
        }), 500

    finally:
        cursor.close()


@productos_bp.route('/<int:id_producto>', methods=['DELETE'])
def eliminar_producto(id_producto):

    cursor = mysql.connection.cursor()

    try:

        cursor.execute("""
            DELETE FROM productos
            WHERE id_producto = %s
        """, (id_producto,))

        mysql.connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                'error': 'Producto no encontrado'
            }), 404

        return jsonify({
            'mensaje': 'Producto eliminado correctamente'
        })

    except Exception as e:

        mysql.connection.rollback()

        return jsonify({
            'error': 'No se puede eliminar el producto porque tiene movimientos o está asociado a una caja'
        }), 409

    finally:
        cursor.close()