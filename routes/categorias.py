from flask import Blueprint, request, jsonify
from extensions import mysql

categorias_bp = Blueprint('categorias', __name__)


@categorias_bp.route('/', methods=['GET'])
def obtener_categorias():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT id_categoria, nombre, descripcion
            FROM categorias
            ORDER BY nombre
        """)
        categorias = cursor.fetchall()
        cursor.close()

        resultado = [
            {
                'id_categoria': cat[0],
                'nombre': cat[1],
                'descripcion': cat[2]
            }
            for cat in categorias
        ]

        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@categorias_bp.route('/', methods=['POST'])
def crear_categoria():
    datos = request.get_json()

    if not datos:
        return jsonify({'error': 'No se recibieron datos'}), 400

    nombre = datos.get('nombre')
    descripcion = datos.get('descripcion')

    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400

    cursor = mysql.connection.cursor()

    try:
        cursor.execute("""
            INSERT INTO categorias (nombre, descripcion)
            VALUES (%s, %s)
        """, (nombre, descripcion))

        mysql.connection.commit()
        id_categoria = cursor.lastrowid

        return jsonify({
            'mensaje': 'Categoría creada correctamente',
            'id_categoria': id_categoria
        }), 201

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()


@categorias_bp.route('/<int:id_categoria>', methods=['GET'])
def obtener_categoria(id_categoria):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT id_categoria, nombre, descripcion
            FROM categorias
            WHERE id_categoria = %s
        """, (id_categoria,))

        categoria = cursor.fetchone()
        cursor.close()

        if not categoria:
            return jsonify({'error': 'Categoría no encontrada'}), 404

        return jsonify({
            'id_categoria': categoria[0],
            'nombre': categoria[1],
            'descripcion': categoria[2]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@categorias_bp.route('/<int:id_categoria>', methods=['PUT'])
def actualizar_categoria(id_categoria):
    datos = request.get_json()

    if not datos:
        return jsonify({'error': 'No se recibieron datos'}), 400

    nombre = datos.get('nombre')
    descripcion = datos.get('descripcion')

    if not nombre:
        return jsonify({'error': 'El nombre es obligatorio'}), 400

    cursor = mysql.connection.cursor()

    try:
        cursor.execute("""
            UPDATE categorias
            SET nombre = %s, descripcion = %s
            WHERE id_categoria = %s
        """, (nombre, descripcion, id_categoria))

        mysql.connection.commit()

        if cursor.rowcount == 0:
            return jsonify({'error': 'Categoría no encontrada'}), 404

        return jsonify({'mensaje': 'Categoría actualizada correctamente'}), 200

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()


@categorias_bp.route('/<int:id_categoria>', methods=['DELETE'])
def eliminar_categoria(id_categoria):
    cursor = mysql.connection.cursor()

    try:
        cursor.execute("""
            DELETE FROM categorias
            WHERE id_categoria = %s
        """, (id_categoria,))

        mysql.connection.commit()

        if cursor.rowcount == 0:
            return jsonify({'error': 'Categoría no encontrada'}), 404

        return jsonify({'mensaje': 'Categoría eliminada correctamente'}), 200

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({
            'error': 'No se puede eliminar la categoría porque tiene productos asociados'
        }), 409

    finally:
        cursor.close()