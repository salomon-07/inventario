from flask import Blueprint, request, jsonify
from flask_mysqldb import MySQL

movimientos_bp = Blueprint(
    'movimientos',
    __name__
)


@movimientos_bp.route('/', methods=['GET'])
def obtener_movimientos():

    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT
            m.id_movimiento,
            m.fecha,
            p.codigo,
            p.nombre,
            c.codigo_qr,
            m.tipo,
            m.cantidad,
            m.stock_anterior,
            m.stock_nuevo,
            m.motivo
        FROM movimientos m
        INNER JOIN productos p
            ON m.id_producto = p.id_producto
        LEFT JOIN cajas c
            ON m.id_caja = c.id_caja
        ORDER BY m.fecha DESC
    """)

    movimientos = cursor.fetchall()

    cursor.close()

    resultado = []

    for movimiento in movimientos:

        resultado.append({
            'id_movimiento': movimiento[0],
            'fecha': movimiento[1].isoformat()
                if movimiento[1] else None,
            'codigo_producto': movimiento[2],
            'producto': movimiento[3],
            'codigo_caja': movimiento[4],
            'tipo': movimiento[5],
            'cantidad': movimiento[6],
            'stock_anterior': movimiento[7],
            'stock_nuevo': movimiento[8],
            'motivo': movimiento[9]
        })

    return jsonify(resultado)


@movimientos_bp.route('/', methods=['POST'])
def crear_movimiento():

    datos = request.get_json()

    id_producto = datos.get('id_producto')
    id_caja = datos.get('id_caja')
    tipo = datos.get('tipo')
    cantidad = datos.get('cantidad')
    motivo = datos.get('motivo')

    if not id_producto or not tipo or not cantidad:
        return jsonify({
            'error': 'Producto, tipo y cantidad son obligatorios'
        }), 400

    if tipo not in ['ENTRADA', 'SALIDA', 'AJUSTE']:
        return jsonify({
            'error': 'Tipo de movimiento inválido'
        }), 400

    cursor = mysql.connection.cursor()

    try:

        cursor.execute("""
            SELECT stock
            FROM productos
            WHERE id_producto = %s
            FOR UPDATE
        """, (id_producto,))

        producto = cursor.fetchone()

        if not producto:
            mysql.connection.rollback()

            return jsonify({
                'error': 'Producto no encontrado'
            }), 404

        stock_anterior = producto[0]

        if tipo == 'ENTRADA':
            stock_nuevo = stock_anterior + cantidad

        elif tipo == 'SALIDA':
            stock_nuevo = stock_anterior - cantidad

            if stock_nuevo < 0:
                mysql.connection.rollback()

                return jsonify({
                    'error': 'No hay suficiente stock'
                }), 400

        else:
            stock_nuevo = cantidad

        cursor.execute("""
            UPDATE productos
            SET stock = %s
            WHERE id_producto = %s
        """, (
            stock_nuevo,
            id_producto
        ))

        cursor.execute("""
            INSERT INTO movimientos
            (
                id_producto,
                id_caja,
                tipo,
                cantidad,
                stock_anterior,
                stock_nuevo,
                motivo
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            id_producto,
            id_caja,
            tipo,
            cantidad,
            stock_anterior,
            stock_nuevo,
            motivo
        ))

        mysql.connection.commit()

        return jsonify({
            'mensaje': 'Movimiento registrado correctamente',
            'stock_anterior': stock_anterior,
            'stock_nuevo': stock_nuevo
        }), 201

    except Exception as e:

        mysql.connection.rollback()

        return jsonify({
            'error': str(e)
        }), 500

    finally:
        cursor.close()


@movimientos_bp.route('/recientes', methods=['GET'])
def movimientos_recientes():

    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT
            m.id_movimiento,
            m.fecha,
            p.nombre,
            c.codigo_qr,
            m.tipo,
            m.cantidad,
            m.stock_nuevo
        FROM movimientos m
        INNER JOIN productos p
            ON m.id_producto = p.id_producto
        LEFT JOIN cajas c
            ON m.id_caja = c.id_caja
        ORDER BY m.fecha DESC
        LIMIT 10
    """)

    movimientos = cursor.fetchall()

    cursor.close()

    resultado = []

    for movimiento in movimientos:

        resultado.append({
            'id_movimiento': movimiento[0],
            'fecha': movimiento[1].isoformat()
                if movimiento[1] else None,
            'producto': movimiento[2],
            'caja': movimiento[3],
            'tipo': movimiento[4],
            'cantidad': movimiento[5],
            'stock_nuevo': movimiento[6]
        })

    return jsonify(resultado)