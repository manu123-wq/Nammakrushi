"""
SQLAlchemy ORM Models for NammaKrushi
Defines Product, Order, Traceability, and MarketRate entities mapping to SQLite tables.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from datetime import datetime
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    unit = Column(String, default="kg")
    availableStock = Column(Float, nullable=False, default=100.0)
    farmerName = Column(String, nullable=False)
    farmerLocation = Column(String, nullable=False)
    farmerPhone = Column(String, nullable=True)
    isVerified = Column(Integer, default=1)
    imageUrl = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    qualityGrade = Column(String, default="Grade A")
    rating = Column(Float, default=5.0)
    reviewCount = Column(Integer, default=0)
    isFarmerProduce = Column(Integer, default=1)
    harvestDate = Column(String, nullable=True)
    batchNumber = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "price": self.price,
            "unit": self.unit or "kg",
            "availableStock": self.availableStock,
            "farmerName": self.farmerName,
            "farmerLocation": self.farmerLocation,
            "farmerPhone": self.farmerPhone or "",
            "isVerified": bool(self.isVerified),
            "imageUrl": self.imageUrl,
            "description": self.description,
            "qualityGrade": self.qualityGrade,
            "rating": self.rating,
            "reviewCount": self.reviewCount,
            "isFarmerProduce": bool(self.isFarmerProduce),
            "harvestDate": self.harvestDate,
            "batchNumber": self.batchNumber
        }


class Order(Base):
    __tablename__ = "orders"

    orderId = Column(String, primary_key=True, index=True)
    date = Column(String, nullable=False)
    status = Column(String, default="Confirmed")
    deliveryMode = Column(String, default="doorstep")
    deliveryAddress = Column(String, nullable=False)
    consumerName = Column(String, nullable=False)
    consumerPhone = Column(String, nullable=False)
    paymentMode = Column(String, nullable=False)
    transactionId = Column(String, nullable=True)
    gatewayStatus = Column(String, default="SUCCESS")
    driverName = Column(String, nullable=True)
    driverPhone = Column(String, nullable=True)
    vehicleNumber = Column(String, nullable=True)
    estimatedDelivery = Column(String, nullable=True)
    total = Column(Float, nullable=False)
    isFavorite = Column(Integer, default=0)
    rated = Column(Integer, default=0)
    rating = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    itemsJson = Column(Text, nullable=False, default="[]")
    trackingMilestonesJson = Column(Text, nullable=True, default="[]")
    createdAt = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            "orderId": self.orderId,
            "date": self.date,
            "status": self.status,
            "deliveryMode": self.deliveryMode,
            "deliveryAddress": self.deliveryAddress,
            "consumerName": self.consumerName,
            "consumerPhone": self.consumerPhone,
            "paymentMode": self.paymentMode,
            "transactionId": self.transactionId,
            "gatewayStatus": self.gatewayStatus,
            "driverName": self.driverName,
            "driverPhone": self.driverPhone,
            "vehicleNumber": self.vehicleNumber,
            "estimatedDelivery": self.estimatedDelivery,
            "total": self.total,
            "isFavorite": bool(self.isFavorite),
            "rated": bool(self.rated),
            "rating": self.rating,
            "feedback": self.feedback,
            "items": json.loads(self.itemsJson or "[]"),
            "trackingMilestones": json.loads(self.trackingMilestonesJson or "[]")
        }


class Traceability(Base):
    __tablename__ = "traceability"

    productId = Column(String, primary_key=True, index=True)
    productTitle = Column(String, nullable=False)
    batchNumber = Column(String, nullable=False)
    harvestDate = Column(String, nullable=False)
    harvestTimestamp = Column(String, nullable=True)
    farmLocationJson = Column(Text, nullable=False)
    farmerDetailsJson = Column(Text, nullable=False)
    qualityMetricsJson = Column(Text, nullable=False)
    transportLogsJson = Column(Text, nullable=False)
    verificationHash = Column(String, nullable=False)
    qrPayload = Column(Text, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            "productId": self.productId,
            "productTitle": self.productTitle,
            "batchNumber": self.batchNumber,
            "harvestDate": self.harvestDate,
            "harvestTimestamp": self.harvestTimestamp,
            "farmLocation": json.loads(self.farmLocationJson or "{}"),
            "farmerDetails": json.loads(self.farmerDetailsJson or "{}"),
            "qualityMetrics": json.loads(self.qualityMetricsJson or "{}"),
            "transportLogs": json.loads(self.transportLogsJson or "[]"),
            "verificationHash": self.verificationHash,
            "qrPayload": self.qrPayload
        }


class MarketRate(Base):
    __tablename__ = "market_rates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    crop = Column(String, nullable=False)
    mandi = Column(String, nullable=False)
    minPrice = Column(Float, nullable=False)
    maxPrice = Column(Float, nullable=False)
    modalPrice = Column(Float, nullable=False)
    unit = Column(String, default="Quintal")
    trend = Column(String, default="steady")
    change = Column(String, nullable=True)
    arrivals = Column(String, nullable=True)
    updatedAt = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "crop": self.crop,
            "mandi": self.mandi,
            "minPrice": self.minPrice,
            "maxPrice": self.maxPrice,
            "modalPrice": self.modalPrice,
            "unit": self.unit,
            "trend": self.trend,
            "change": self.change,
            "arrivals": self.arrivals
        }
