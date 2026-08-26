from flask import Flask, render_template
from flask_mysqldb import MySQL
from config import Config
from routes.categorias import categorias_bp
from routes.estantes import estantes_bp
from routes.productos import productos_bp
from routes.cajas import cajas_bp
from routes.movimientos import movimientos_bp


app = Flask(__name__)

# Cargar configuración
app.config.from_object(Config)

# Inicializar MySQL
mysql = MySQL(app)


# Registrar Blueprints
app.register_blueprint(
    categorias_bp,
    url_prefix='/api/categorias'
)

app.register_blueprint(
    estantes_bp,
    url_prefix='/api/estantes'
)

app.register_blueprint(
    productos_bp,
    url_prefix='/api/productos'
)

app.register_blueprint(
    cajas_bp,
    url_prefix='/api/cajas'
)

app.register_blueprint(
    movimientos_bp,
    url_prefix='/api/movimientos'
)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api')
def api():
    return {
        'sistema': 'Sys Bodega',
        'estado': 'activo',
        'mensaje': 'API funcionando correctamente'
    }


@app.errorhandler(404)
def error_404(error):
    return {
        'error': 'Ruta no encontrada'
    }, 404


@app.errorhandler(500)
def error_500(error):
    return {
        'error': 'Error interno del servidor'
    }, 500


if __name__ == '__main__':
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )