from flask import Flask, render_template
from config import Config
from extensions import mysql

# Registrar Blueprints
from routes.categorias import categorias_bp
from routes.estantes import estantes_bp
from routes.productos import productos_bp
from routes.cajas import cajas_bp
from routes.movimientos import movimientos_bp

app = Flask(__name__)
app.config.from_object(Config)

# Inicializar MySQL con la app
mysql.init_app(app)

# Blueprints
app.register_blueprint(categorias_bp, url_prefix='/api/categorias')
app.register_blueprint(estantes_bp, url_prefix='/api/estantes')
app.register_blueprint(productos_bp, url_prefix='/api/productos')
app.register_blueprint(cajas_bp, url_prefix='/api/cajas')
app.register_blueprint(movimientos_bp, url_prefix='/api/movimientos')

# Vistas Web
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/productos')
def productos_view():
    return render_template('productos.html')

@app.route('/productos/nuevo')
def nuevo_producto_view():
    return render_template('nuevo_producto.html')

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

# Health check API
@app.route('/api')
def api():
    return {
        'sistema': 'Sys Bodega',
        'estado': 'activo',
        'mensaje': 'API funcionando correctamente'
    }

# Manejadores de errores
@app.errorhandler(404)
def error_404(error):
    return {'error': 'Ruta no encontrada'}, 404

@app.errorhandler(500)
def error_500(error):
    return {'error': 'Error interno del servidor'}, 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)