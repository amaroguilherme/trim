from app import create_app
from app.routes import api
from flask_cors import CORS

app = create_app()

CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(api)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True)
