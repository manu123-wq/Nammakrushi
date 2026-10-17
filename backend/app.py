"""
NammaKrushi Python Flask REST API Server
Backed by SQLAlchemy ORM & SQLite (nammakrushi.sqlite)
MVC Structured for easy debugging and running in VS Studio / VS Code.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from .controllers import (
    ProductController, 
    OrderController, 
    TraceabilityController, 
    MarketRateController
)
from .database import engine, Base

app = Flask(__name__)
CORS(app)

# Ensure tables exist
Base.metadata.create_all(bind=engine)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "engine": "SQLAlchemy ORM + SQLite",
        "database": "nammakrushi.sqlite",
        "framework": "Flask MVC REST API"
    })

# --- Product Routes ---
@app.route('/api/products', methods=['GET', 'POST'])
def products():
    if request.method == 'GET':
        category = request.args.get('category')
        farmer_only = request.args.get('farmerOnly') == 'true'
        res = ProductController.get_all(category=category, farmer_only=farmer_only)
        return jsonify(res), 200
    else:
        data = request.get_json() or {}
        res = ProductController.create(data)
        return jsonify(res), 201

@app.route('/api/products/<product_id>', methods=['GET'])
def product_detail(product_id):
    res = ProductController.get_by_id(product_id)
    return jsonify(res), 200 if res.get('success') else 404

# --- Order Routes ---
@app.route('/api/orders', methods=['GET', 'POST'])
def orders():
    if request.method == 'GET':
        res = OrderController.get_all()
        return jsonify(res), 200
    else:
        data = request.get_json() or {}
        res = OrderController.create(data)
        return jsonify(res), 201

@app.route('/api/orders/<order_id>', methods=['GET'])
def order_detail(order_id):
    res = OrderController.get_by_id(order_id)
    return jsonify(res), 200 if res.get('success') else 404

@app.route('/api/orders/rate', methods=['POST'])
def order_rate():
    data = request.get_json() or {}
    order_id = data.get('orderId')
    rating = data.get('rating')
    feedback = data.get('feedback', '')
    res = OrderController.submit_rating(order_id, rating, feedback)
    return jsonify(res), 200 if res.get('success') else 400

# --- Farm-to-Table Traceability Routes ---
@app.route('/api/traceability/<product_id>', methods=['GET'])
def traceability(product_id):
    res = TraceabilityController.get_by_product_id(product_id)
    return jsonify(res), 200 if res.get('success') else 404

# --- Market Rates Routes ---
@app.route('/api/market_rates', methods=['GET'])
def market_rates():
    res = MarketRateController.get_all()
    return jsonify(res), 200

if __name__ == '__main__':
    print("🌾 NammaKrushi SQLAlchemy Server starting on http://localhost:5000")
    print("📁 SQLite Database File: nammakrushi.sqlite")
    app.run(host='0.0.0.0', port=5000, debug=True)
