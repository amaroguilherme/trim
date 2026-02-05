from flask import Flask
from flask_cors import CORS
from config import Config, limiter


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    #TODO; THIS NEEDS TO BE DYNAMIC PER ENVIRONMENT
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    limiter.init_app(app)
    
    from app.routes import api
    app.register_blueprint(api)
    
    return app
