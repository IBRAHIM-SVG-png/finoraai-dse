import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import init_db

# Import Blueprints
from routes.auth import auth_bp
from routes.transactions import transactions_bp
from routes.budgets import budgets_bp
from routes.goals import goals_bp
from routes.simulation import simulation_bp
from routes.ai_assistant import ai_bp
from routes.reports import reports_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.url_map.strict_slashes = False

    # Initialize CORS for seamless frontend-backend communication
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Ensure database tables exist
    init_db()

    # Register Blueprint routes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(budgets_bp, url_prefix='/api/budgets')
    app.register_blueprint(goals_bp, url_prefix='/api/goals')
    app.register_blueprint(simulation_bp, url_prefix='/api/simulation')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "system": "Intelligent Personal Finance & Future Simulation System API",
            "version": "1.0.0"
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error occurred"}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    print(f"Flask API server running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
