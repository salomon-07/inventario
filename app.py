from flask import Flask, render_template
from config import Config
from extensions import mysql
from flask import Flask, render_template, jsonify, request
from routes.categorias import categorias_bp
from routes.estantes import estantes_bp
from routes.productos import productos_bp
from routes.cajas import cajas_bp
from routes.movimientos import movimientos_bp

app = Flask(__name__)
app.config.from_object(Config)

mysql.init_app(app)

app.register_blueprint(categorias_bp, url_prefix='/api/categorias')
app.register_blueprint(estantes_bp, url_prefix='/api/estantes')
app.register_blueprint(productos_bp, url_prefix='/api/productos')
app.register_blueprint(cajas_bp, url_prefix='/api/cajas')
app.register_blueprint(movimientos_bp, url_prefix='/api/movimientos')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/entradas/', methods=['GET'])
def get_entradas():
    try:
        cursor = db.cursor(dictionary=True)
        query = """
            SELECT e.id_entrada, p.nombre AS producto, e.cantidad, 
                   c.nombre AS caja, e.motivo, e.observacion, 
                   DATE_FORMAT(e.fecha, '%Y-%m-%d %H:%i') AS fecha
            FROM entradas e
            JOIN productos p ON e.id_producto = p.id_producto
            LEFT JOIN cajas c ON e.id_caja = c.id_caja
            ORDER BY e.fecha DESC
        """
        cursor.execute(query)
        entradas = cursor.fetchall()
        return jsonify(entradas), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 500

@app.route('/api/salidas/', methods=['GET'])
def get_salidas():
    try:
        cursor = db.cursor(dictionary=True)
        query = """
            SELECT s.id_salida, p.nombre AS producto, s.cantidad, 
                   s.tipo_salida, s.destino, s.observacion, 
                   DATE_FORMAT(s.fecha, '%Y-%m-%d %H:%i') AS fecha
            FROM salidas s
            JOIN productos p ON s.id_producto = p.id_producto
            ORDER BY s.fecha DESC
        """
        cursor.execute(query)
        salidas = cursor.fetchall()
        return jsonify(salidas), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        cur = mysql.connection.cursor()
        
        # Cantidad de productos distintos
        cur.execute("SELECT COUNT(*) FROM productos")
        total_productos = cur.fetchone()[0] or 0
        
        # Suma total de unidades en existencia
        cur.execute("SELECT COALESCE(SUM(stock), 0) FROM productos")
        total_stock = cur.fetchone()[0] or 0
        
        # Total de cajas registradas
        cur.execute("SELECT COUNT(*) FROM cajas")
        total_cajas = cur.fetchone()[0] or 0
        
        cur.close()
        
        return jsonify({
            "total_productos": total_productos,
            "total_stock": total_stock,
            "total_cajas": total_cajas
        }), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 500

@app.route('/productos')
def productos_view():
    return render_template('productos.html')

@app.route('/productos/nuevo')
def nuevo_producto_view():
    return render_template('crear_producto.html')

@app.route('/cajas')
def cajas_view():
    return render_template('cajas.html')

@app.route('/cajas/nueva')
def nueva_caja_view():
    return render_template('nueva_caja.html')

@app.route('/estantes')
def estantes_view():
    return render_template('estantes.html')

@app.route('/entradas')
def entradas_view():
    return render_template('entradas.html')

@app.route('/salidas')
def salidas_view():
    return render_template('salidas.html')

@app.route('/movimientos')
def movimientos_view():
    return render_template('movimientos.html')

@app.route('/categorias')
def categorias_view():
    return render_template('categorias.html')

@app.route('/api')
def api():
    return {
        'sistema': 'Sys Bodega',
        'estado': 'activo',
        'mensaje': 'API funcionando correctamente'
    }

@app.errorhandler(404)
def error_404(error):
    return {'error': 'Ruta no encontrada'}, 404

@app.errorhandler(500)
def error_500(error):
    return {'error': 'Error interno del servidor'}, 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)