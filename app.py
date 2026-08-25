# app.py
from flask import Flask, render_template
from flask_mysqldb import MySQL
from config import Config

app = Flask(__name__)

# Cargar la configuración desde la clase Config
app.config.from_object(Config)

# Inicializar MySQL
mysql = MySQL(app)

@app.route('/')
def index():
    try:
        # Probar la conexión ejecutando una consulta simple
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        return "Conexion Realizada a la base de datos"
    except Exception as e:
        return f"Error al conectar a la base de datos: {e}"

if __name__ == '__main__':
    app.run(debug=True)
