# Stock Management System

A modern, mobile-first stock management application that combines barcode scanning with product lookup to streamline inventory management. Built with Angular frontend and Spring Boot backend.

### **Mobile/Desktop**
- **Responsive Design**: Seamlessly works on desktop, tablet, and mobile devices
- **Touch-Friendly**: Large buttons and intuitive touch interactions
- **Card-based Layout**: Modern UI with card layouts for mobile and table view for desktop

### **Advanced Barcode Scanning**
- **Camera Integration**: Real-time barcode scanning using device camera
- **Torch/Flash Control**: Toggle flashlight for better scanning in low light (iOS/Android support)
- **Manual Input**: Alternative barcode entry for damaged or hard-to-scan codes
- **Multiple Format Support**: Supports various barcode formats via ZXing library

### **Smart Product Lookup**
- **Open Food Facts Integration**: Automatic product information retrieval
- **Real-time Search**: Instant product details when scanning unknown barcodes
- **Product Database**: Local database for quick access to frequently scanned items

### **Inventory Management**
- **Stock Tracking**: Real-time quantity monitoring
- **Add/Remove Stock**: Quick stock adjustments with quantity selectors
- **Edit Products**: Modify product names and quantities with validation
- **Batch Operations**: Efficient handling of multiple item

## Tech Stack

### Frontend
- **Angular**
- **TypeScript**
- **SCSS**
- **@zxing/ngx-scanner** for barcode scanning

### Backend
- **Spring Boot**
- **Spring Data JPA** 
- **PostgreSQL** using a docker container
- **REST API** with CORS configuration
- **Maven** for dependency management

### External APIs
- **Open Food Facts API** for product information retrieval

## Prerequisites

- **Node.js** 18+ and npm
- **Java 21+**
- **Maven 3.6+**
- **Device with camera** (for barcode scanning)

## 🚀 Quick Start

### Backend Setup
```bash
cd Manage_Stock_APP
./mvnw spring-boot:run
```
### Frontend Setup
```bash
cd STOCK_APP_FRONTEND
npm install
npm run start:network
```
