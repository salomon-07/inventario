from flask import Blueprint, request, jsonify
from flask_mysqldb import MySQL

estantes_bp = Blueprint(
    'estantes',
    __name__
)


@estantes_bp.route('/', methods=['GET'])
def obtener_estantes():

    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT
            e.id_estante,
            e.nombre,
            e.descripcion,
            e.ubicacion,
            e.estado,
            COUNT(c.id_caja) AS total_cajas
        FROM estantes e
        LEFT JOIN cajas c
            ON e.id_estante = c.id_estante
        GROUP BY
            e.id_estante,
            e.nombre,
            e.descripcion,
            e.ubicacion,
            e.estado
        ORDER BY e.id_estante
    """)

    estantes = cursor.fetchall()

    cursor.close()

    resultado = []

    for estante in estantes:

        resultado.append({
            'id_estante': estante[0],
            'nombre': estante[1],
            'descripcion': estante[2],
            'ubicacion': estante[3],
            'estado': estante[4],
            'total_cajas': estante[5]
        })

    return jsonify(resultado)


@estantes_bp.route('/', methods=['POST'])
def crear_estante():

    datos = request.get_json()

    nombre = datos.get('nombre')
    descripcion = datos.get('descripcion')
    ubicacion = datos.get('ubicacion')

    if not nombre:
        return jsonify({
            'error': 'El nombre es obligatorio'
        }), 400

    cursor = mysql.connection.cursor()

    try:

        cursor.execute("""
            INSERT INTO estantes
            (nombre, descripcion, ubicacion)
            VALUES (%s, %s, %s)
        """, (
            nombre,
            descripcion,
            ubicacion
        ))

        mysql.connection.commit()

        return jsonify({
            'mensaje': 'Estante creado correctamente',
            'id_estante': cursor.lastrowid
        }), 201

    except Exception as e:

        mysql.connection.rollback()

        return jsonify({
            'error': str(e)
        }), 500

    finally:
        cursor.close()


@estantes_bp.route('/<int:id_estante>', methods=['GET'])
def obtener_estante(id_estante):

    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT
            id_estante,
            nombre,
            descripcion,
            ubicacion,
            estado
        FROM estantes
        WHERE id_estante = %s
    """, (id_estante,))

    estante = cursor.fetchone()

    cursor.close()

    if not estante:
        return jsonify({
            'error': 'Estante no encontrado'
        }), 404

    return jsonify({
        'id_estante': estante[0],
        'nombre': estante[1],
        'descripcion': estante[2],
        'ubicacion': estante[3],
        'estado': estante[4]
    })


@estantes_bp.route('/<int:id_estante>/cajas', methods=['GET'])
def cajas_estante(id_estante):

    cursor = mysql.connection.cursor()

    cursor.execute("""
        SELECT
            id_caja,
            codigo_qr,
            nombre,
            descripcion,
            estado
        FROM cajas
        WHERE id_estante = %s
        ORDER BY id_caja
    """, (id_estante,))

    cajas = cursor.fetchall()

    cursor.close()

    resultado = []

    for caja in cajas:

        resultado.append({
            'id_caja': caja[0],
            'codigo_qr': caja[1],
            'nombre': caja[2],
            'descripcion': caja[3],
            'estado': caja[4]
        })

    return jsonify(resultado)