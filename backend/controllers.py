"""
NammaKrushi MVC Controllers for SQLAlchemy Backend
"""

import json
from .database import SessionLocal
from .models import Product, Order, Traceability, MarketRate

class ProductController:
    @staticmethod
    def get_all(category=None, farmer_only=False):
        db = SessionLocal()
        try:
            query = db.query(Product)
            if category and category not in ['All', 'All Produce']:
                query = query.filter(Product.category == category)
            if farmer_only:
                query = query.filter(Product.isFarmerProduce == 1)
            products = query.order_by(Product.createdAt.desc()).all()
            return {"success": True, "products": [p.to_dict() for p in products]}
        finally:
            db.close()

    @staticmethod
    def get_by_id(product_id):
        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                return {"success": False, "error": "Product not found"}
            return {"success": True, "product": product.to_dict()}
        finally:
            db.close()

    @staticmethod
    def create(data):
        db = SessionLocal()
        try:
            prod = Product(
                id=data.get("id") or f"prod-{int(data.get('timestamp', 1))}",
                title=data.get("title"),
                category=data.get("category", "Vegetables"),
                price=float(data.get("price", 0)),
                unit=data.get("unit", "kg"),
                availableStock=float(data.get("availableStock", 100)),
                farmerName=data.get("farmerName", "Verified Farmer"),
                farmerLocation=data.get("farmerLocation", "Dharwad, Karnataka"),
                farmerPhone=data.get("farmerPhone", ""),
                isVerified=1 if data.get("isVerified", True) else 0,
                imageUrl=data.get("imageUrl"),
                description=data.get("description", "Direct from farm"),
                qualityGrade=data.get("qualityGrade", "Grade A"),
                rating=float(data.get("rating", 5.0)),
                reviewCount=int(data.get("reviewCount", 1)),
                isFarmerProduce=1 if data.get("isFarmerProduce", True) else 0,
                harvestDate=data.get("harvestDate", "Fresh harvest"),
                batchNumber=data.get("batchNumber") or f"BATCH-KA-{data.get('id', 'PROD')}"
            )
            db.merge(prod)
            db.commit()
            return {"success": True, "product": prod.to_dict()}
        finally:
            db.close()


class OrderController:
    @staticmethod
    def get_all():
        db = SessionLocal()
        try:
            orders = db.query(Order).order_by(Order.createdAt.desc()).all()
            return {"success": True, "orders": [o.to_dict() for o in orders]}
        finally:
            db.close()

    @staticmethod
    def get_by_id(order_id):
        db = SessionLocal()
        try:
            order = db.query(Order).filter(Order.orderId == order_id).first()
            if not order:
                return {"success": False, "error": "Order not found"}
            return {"success": True, "order": order.to_dict()}
        finally:
            db.close()

    @staticmethod
    def create(data):
        db = SessionLocal()
        try:
            order = Order(
                orderId=data.get("orderId"),
                date=data.get("date", "Today, Just now"),
                status=data.get("status", "Confirmed"),
                deliveryMode=data.get("deliveryMode", "doorstep"),
                deliveryAddress=data.get("deliveryAddress", "Bangalore, Karnataka"),
                consumerName=data.get("consumerName", "Consumer"),
                consumerPhone=data.get("consumerPhone", "9876543210"),
                paymentMode=data.get("paymentMode", "UPI (Direct Escrow)"),
                transactionId=data.get("transactionId", ""),
                gatewayStatus=data.get("gatewayStatus", "SUCCESS"),
                driverName=data.get("driverName", "Manjunath Kariyappa"),
                driverPhone=data.get("driverPhone", "9448123988"),
                vehicleNumber=data.get("vehicleNumber", "KA-25-EA-8842"),
                estimatedDelivery=data.get("estimatedDelivery", "Within 24 Hours"),
                total=float(data.get("total", 0)),
                isFavorite=1 if data.get("isFavorite", False) else 0,
                rated=1 if data.get("rated", False) else 0,
                rating=data.get("rating"),
                feedback=data.get("feedback"),
                itemsJson=json.dumps(data.get("items", [])),
                trackingMilestonesJson=json.dumps(data.get("trackingMilestones", []))
            )
            db.merge(order)
            db.commit()
            return {"success": True, "order": order.to_dict()}
        finally:
            db.close()

    @staticmethod
    def submit_rating(order_id, rating, feedback):
        db = SessionLocal()
        try:
            order = db.query(Order).filter(Order.orderId == order_id).first()
            if not order:
                return {"success": False, "error": "Order not found"}
            order.rated = 1
            order.rating = rating
            order.feedback = feedback
            db.commit()
            return {"success": True, "message": "Rating recorded"}
        finally:
            db.close()


class TraceabilityController:
    @staticmethod
    def get_by_product_id(product_id):
        db = SessionLocal()
        try:
            trace = db.query(Traceability).filter(Traceability.productId == product_id).first()
            if not trace:
                return {"success": False, "error": "Traceability not found"}
            return {"success": True, "traceability": trace.to_dict()}
        finally:
            db.close()


class MarketRateController:
    @staticmethod
    def get_all():
        db = SessionLocal()
        try:
            rates = db.query(MarketRate).all()
            return {"success": True, "rates": [r.to_dict() for r in rates]}
        finally:
            db.close()
