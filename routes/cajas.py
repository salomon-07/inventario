from flask import Blueprint, request, jsonify
from flask_mysqldb import MySQL

cajas_bp = Blueprint(
    'cajas',
    __name__
)


@cajas_bp.route('/', methods=['GET'])
def obtener_cajas():

    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT
            c.id_caja,
            c.codigo_qr,
            c.nombre,
            c.descripcion,
            c.id_estante,
            e.nombre,
            c.estado,
            COUNT(cp.id_caja_producto)
        FROM cajas c
        INNER JOIN estantes e
            ON c.id_estante = e.id_estante
        LEFT JOIN caja_productos cp
            ON c.id_caja = cp.id_caja
        GROUP BY
            c.id_caja,
            c.codigo_qr,
            c.nombre,
            c.descripcion,
            c.id_estante,
            e.nombre,
            c.estado
        ORDER BY c.id_caja
    """)

    cajas = cursor.fetchall()

    cursor.close()

    resultado = []

    for caja in cajas:

        resultado.append({
            'id_caja': caja[0],
            'codigo_qr': caja[1],
            'nombre': caja[2],
            'descripcion': caja[3],
            'id_estante': caja[4],
            'estante': caja[5],
            'estado': caja[6],
            'total_productos': caja[7]
        })

    return jsonify(resultado)


@cajas_bp.route('/', methods=['POST'])
def crear_caja():

    datos = request.get_json()

    codigo_qr = datos.get('codigo_qr')
    nombre = datos.get('nombre')
    descripcion = datos.get('descripcion')
    id_estante = datos.get('id_estante')

    if not codigo_qr or not nombre or not id_estante:
        return jsonify({
            'error': 'Código QR, nombre y estante son obligatorios'
        }), 400

    cursor = mysql.connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO cajas
            (
                codigo_qr,
                nombre,
                descripcion,
                id_estante
            )
            VALUES (%s, %s, %s, %s)
        """, (
            codigo_qr,
            nombre,
            descripcion,
            id_estante
        ))

        mysql.connection.commit()

        return jsonify({
            'mensaje': 'Caja creada correctamente',
            'id_caja': cursor.lastrowid,
            'codigo_qr': codigo_qr
        }), 201

    except Exception as e:

        mysql.connection.rollback()

        return jsonify({
            'error': str(e)
        }), 500

    finally:
        cursor.close()


@cajas_bp.route('/qr/<string:codigo_qr>', methods=['GET'])
def consultar_qr(codigo_qr):

    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT
            c.id_caja,
            c.codigo_qr,
            c.nombre,
            c.descripcion,
            e.id_estante,
            e.nombre,
            c.estado
        FROM cajas c
        INNER JOIN estantes e
            ON c.id_estante = e.id_estante
        WHERE c.codigo_qr = %s
    """, (codigo_qr,))

    caja = cursor.fetchone()

    if not caja:
        cursor.close()

        return jsonify({
            'error': 'Caja no encontrada'
        }), 404

    cursor.execute("""
        SELECT
            p.id_producto,
            p.codigo,
            p.nombre,
            d.marca,
            d.modelo,
            cp.cantidad
        FROM caja_productos cp
        INNER JOIN productos p
            ON cp.id_producto = p.id_producto
        LEFT JOIN detalles_producto d
            ON p.id_producto = d.id_producto
        WHERE cp.id_caja = %s
        ORDER BY p.nombre
    """, (caja[0],))

    productos = cursor.fetchall()

    cursor.close()

    contenido = []

    for producto in productos:

        contenido.append({
            'id_producto': producto[0],
            'codigo': producto[1],
            'nombre': producto[2],
            'marca': producto[3],
            'modelo': producto[4],
            'cantidad': producto[5]
        })

    return jsonify({
        'id_caja': caja[0],
        'codigo_qr': caja[1],
        'nombre': caja[2],
        'descripcion': caja[3],
        'id_estante': caja[4],
        'estante': caja[5],
        'estado': caja[6],
        'contenido': contenido
    })


@cajas_bp.route('/<int:id_caja>/productos', methods=['POST'])
def agregar_producto(id_caja):

    datos = request.get_json()

    id_producto = datos.get('id_producto')
    cantidad = datos.get('cantidad')

    if not id_producto or not cantidad:
        return jsonify({
            'error': 'Producto y cantidad son obligatorios'
        }), 400

    cursor = mysql.connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO caja_productos
            (id_caja, id_producto, cantidad)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE
                cantidad = cantidad + VALUES(cantidad)
        """, (
            id_caja,
            id_producto,
            cantidad
        ))

        mysql.connection.commit()

        return jsonify({
            'mensaje': 'Producto agregado a la caja correctamente'
        })

    except Exception as e:

        mysql.connection.rollback()

        return jsonify({
            'error': str(e)
        }), 500

    finally:
        cursor.close()


@cajas_bp.route('/<int:id_caja>/productos/<int:id_producto>', methods=['PUT'])
def actualizar_cantidad(id_caja, id_producto):

    datos = request.get_json()

    cantidad = datos.get('cantidad')

    if cantidad is None or cantidad < 0:
        return jsonify({
            'error': 'Cantidad inválida'
        }), 400

    cursor = mysql.connection.cursor()

    try:

        cursor.execute("""
            UPDATE caja_productos
            SET cantidad = %s
            WHERE id_caja = %s
            AND id_producto = %s
        """, (
            cantidad,
            id_caja,
            id_producto
        ))

        mysql.connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                'error': 'Producto no encontrado en la caja'
            }), 404

        return jsonify({
            'mensaje': 'Cantidad actualizada correctamente'
        })

    except Exception as e:

        mysql.connection.rollback()

        return jsonify({
            'error': str(e)
        }), 500

    finally:
        cursor.close()


@cajas_bp.route('/<int:id_caja>/productos/<int:id_producto>', methods=['DELETE'])
def eliminar_producto_caja(id_caja, id_producto):

    cursor = mysql.connection.cursor()

    try:

        cursor.execute("""
            DELETE FROM caja_productos
            WHERE id_caja = %s
            AND id_producto = %s
        """, (
            id_caja,
            id_producto
        ))

        mysql.connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                'error': 'Producto no encontrado en la caja'
            }), 404

        return jsonify({
            'mensaje': 'Producto eliminado de la caja'
        })

    except Exception as e:

        mysql.connection.rollback()

        return jsonify({
            'error': str(e)
        }), 500

    finally:
        cursor.close()