import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Product } from '../models/product';
import { BarcodeScannerService, OpenFoodFactsProduct } from '../services/barcode-scanner.service';
import { BarcodeScannerComponent } from '../components/barcode-scanner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  imports: [CommonModule, FormsModule, BarcodeScannerComponent],
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild(BarcodeScannerComponent) scanner!: BarcodeScannerComponent;
  
  products: Product[] = [];
  selectedProduct: Product = { name: '', barcode: '', quantity: 0 };
  isEditMode: boolean = false;
  showScanner: boolean = false;
  isLoadingProduct: boolean = false;
  notification: string = '';
  notificationType: 'success' | 'info' | 'error' | '' = '';
  scanQuantity: number = 1; // Default quantity for scanning
  showQuantitySelector: boolean = false;
  pendingBarcode: string = '';
  
  // Manual input properties
  showManualInput: boolean = false;
  manualBarcode: string = '';
  
  // Edit modal properties
  showEditModal: boolean = false;
  editingProduct: Product = { name: '', barcode: '', quantity: 0 };

  // Product lookup state
  isExistingProduct: boolean = false;
  currentStock: number = 0;

  constructor(
    private http: HttpClient,
    private barcodeService: BarcodeScannerService
  ) {}

  private getApiUrl(): string {

      return 'https://pbpdgqxc-8080.uks1.devtunnels.ms';
    
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.http.get<Product[]>(`${this.getApiUrl()}/api/products`).subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error(err)
    });
  }

  saveProduct(): void {
    if (this.isEditMode && this.selectedProduct.id) {
      this.http.put(`${this.getApiUrl()}/api/products/${this.selectedProduct.id}`, this.selectedProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.resetForm();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.http.post(`${this.getApiUrl()}/api/products`, this.selectedProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.resetForm();
        },
        error: (err) => console.error(err)
      });
    }
  }

  editProduct(product: Product): void {
    this.editingProduct = { ...product };
    this.showEditModal = true;
  }

  deleteProduct(product: Product): void {
    if (product.id) {
      this.http.delete(`${this.getApiUrl()}/api/products/${product.id}`).subscribe({
        next: () => this.loadProducts(),
        error: (err) => console.error(err)
      });
    }
  }

  resetForm(): void {
    this.selectedProduct = { name: '', barcode: '', quantity: 0 };
    this.isEditMode = false;
  }

  // Barcode scanning methods
  startBarcodeScanning(): void {
    this.showScanner = true;
    // Start the scanner after the view updates
    setTimeout(() => {
      if (this.scanner) {
        this.scanner.startScanning();
      }
    }, 100);
  }

  onBarcodeScanned(barcode: string): void {
    this.showScanner = false;
    this.processBarcode(barcode);
  }

  onScanningCancelled(): void {
    this.showScanner = false;
  }

  onScannerClosed(): void {
    this.showScanner = false;
  }

  // Manual barcode input
  toggleManualInput(): void {
    this.showManualInput = !this.showManualInput;
    if (!this.showManualInput) {
      this.manualBarcode = '';
    }
  }

  processManualBarcode(): void {
    if (this.manualBarcode.trim()) {
      this.processBarcode(this.manualBarcode.trim());
      this.manualBarcode = '';
      this.showManualInput = false;
    }
  }

  processBarcode(barcode: string): void {
    this.isLoadingProduct = true;
    this.pendingBarcode = barcode;

    // Check if product exists in our database
    const existingProduct = this.products.find(p => p.barcode === barcode);
    
    if (existingProduct) {
      this.isExistingProduct = true;
      this.currentStock = existingProduct.quantity;
      this.selectedProduct = { ...existingProduct };
      this.showQuantitySelector = true;
      this.isLoadingProduct = false;
    } else {
      // Try to get product info from Open Food Facts
      this.barcodeService.getProductByBarcode(barcode).subscribe({
        next: (productInfo: OpenFoodFactsProduct | null) => {
          this.isExistingProduct = false;
          this.currentStock = 0;
          
          if (productInfo && productInfo.product) {
            this.selectedProduct = {
              name: productInfo.product.product_name || 'Unknown Product',
              barcode: barcode,
              quantity: 0
            };
          } else {
            this.selectedProduct = {
              name: 'Unknown Product',
              barcode: barcode,
              quantity: 0
            };
          }
          
          this.showQuantitySelector = true;
          this.isLoadingProduct = false;
        },
        error: (error: any) => {
          console.error('Error fetching product info:', error);
          this.selectedProduct = {
            name: 'Unknown Product',
            barcode: barcode,
            quantity: 0
          };
          this.isExistingProduct = false;
          this.currentStock = 0;
          this.showQuantitySelector = true;
          this.isLoadingProduct = false;
        }
      });
    }
  }

  // Edit modal methods
  saveEditedProduct(): void {
    if (!this.editingProduct.name?.trim()) {
      this.showNotification('Product name is required', 'error');
      return;
    }

    if (this.editingProduct.quantity < 0) {
      this.showNotification('Quantity cannot be negative', 'error');
      return;
    }

    if (this.editingProduct.id) {
      this.http.put(`${this.getApiUrl()}/api/products/${this.editingProduct.id}`, this.editingProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.showNotification(`Updated "${this.editingProduct.name}" successfully`, 'success');
          this.closeEditModal();
        },
        error: (err) => {
          console.error('Error updating product:', err);
          this.showNotification('Error updating product', 'error');
        }
      });
    }
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingProduct = { name: '', barcode: '', quantity: 0 };
  }

  incrementEditQuantity(): void {
    this.editingProduct.quantity++;
  }

  decrementEditQuantity(): void {
    if (this.editingProduct.quantity > 0) {
      this.editingProduct.quantity--;
    }
  }

  incrementProductQuantity(product: Product): void {
    if (product.id) {
      const updatedProduct = { ...product, quantity: product.quantity + 1 };
      this.http.put(`${this.getApiUrl()}/api/products/${product.id}`, updatedProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.showNotification(`Added 1 to "${product.name}"`, 'success');
        },
        error: (err) => {
          console.error('Error updating product:', err);
          this.showNotification('Error updating product', 'error');
        }
      });
    }
  }

  decrementProductQuantity(product: Product): void {
    if (product.id && product.quantity > 0) {
      const updatedProduct = { ...product, quantity: Math.max(0, product.quantity - 1) };
      this.http.put(`${this.getApiUrl()}/api/products/${product.id}`, updatedProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.showNotification(`Removed 1 from "${product.name}"`, 'info');
        },
        error: (err) => {
          console.error('Error updating product:', err);
          this.showNotification('Error updating product', 'error');
        }
      });
    }
  }

  setCustomQuantity(product: Product, quantity: number): void {
    if (product.id && quantity >= 0) {
      const updatedProduct = { ...product, quantity: quantity };
      this.http.put(`${this.getApiUrl()}/api/products/${product.id}`, updatedProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.showNotification(`Set "${product.name}" quantity to ${quantity}`, 'success');
        },
        error: (err) => {
          console.error('Error updating product:', err);
          this.showNotification('Error updating product', 'error');
        }
      });
    }
  }

  quickAddQuantity(product: Product, amount: number): void {
    if (product.id) {
      const newQuantity = Math.max(0, product.quantity + amount);
      const updatedProduct = { ...product, quantity: newQuantity };
      this.http.put(`${this.getApiUrl()}/api/products/${product.id}`, updatedProduct).subscribe({
        next: () => {
          this.loadProducts();
          if (amount > 0) {
            this.showNotification(`Added ${amount} to "${product.name}"`, 'success');
          } else {
            this.showNotification(`Removed ${Math.abs(amount)} from "${product.name}"`, 'info');
          }
        },
        error: (err) => {
          console.error('Error updating product:', err);
          this.showNotification('Error updating product', 'error');
        }
      });
    }
  }

  // Quantity selector methods
  incrementScanQuantity(): void {
    this.scanQuantity++;
  }

  decrementScanQuantity(): void {
    if (this.scanQuantity > 1) {
      this.scanQuantity--;
    }
  }

  addToStock(): void {
    if (this.isExistingProduct) {
      // Update existing product
      const product = this.products.find(p => p.barcode === this.pendingBarcode);
      if (product && product.id) {
        const updatedProduct = { ...product, quantity: product.quantity + this.scanQuantity };
        this.http.put(`${this.getApiUrl()}/api/products/${product.id}`, updatedProduct).subscribe({
          next: () => {
            this.loadProducts();
            this.showNotification(`Added ${this.scanQuantity} to "${product.name}"`, 'success');
            this.cancelQuantitySelection();
          },
          error: (err) => {
            console.error('Error updating product:', err);
            this.showNotification('Error updating product', 'error');
          }
        });
      }
    } else {
      // Create new product
      const newProduct = { ...this.selectedProduct, quantity: this.scanQuantity };
      this.http.post(`${this.getApiUrl()}/api/products`, newProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.showNotification(`Added new product "${newProduct.name}" with quantity ${this.scanQuantity}`, 'success');
          this.cancelQuantitySelection();
        },
        error: (err) => {
          console.error('Error creating product:', err);
          this.showNotification('Error creating product', 'error');
        }
      });
    }
  }

  removeFromStock(): void {
    const product = this.products.find(p => p.barcode === this.pendingBarcode);
    if (product && product.id) {
      const newQuantity = Math.max(0, product.quantity - this.scanQuantity);
      const updatedProduct = { ...product, quantity: newQuantity };
      
      this.http.put(`${this.getApiUrl()}/api/products/${product.id}`, updatedProduct).subscribe({
        next: () => {
          this.loadProducts();
          this.showNotification(`Removed ${this.scanQuantity} from "${product.name}"`, 'info');
          this.cancelQuantitySelection();
        },
        error: (err) => {
          console.error('Error updating product:', err);
          this.showNotification('Error updating product', 'error');
        }
      });
    }
  }

  cancelQuantitySelection(): void {
    this.showQuantitySelector = false;
    this.scanQuantity = 1;
    this.pendingBarcode = '';
    this.selectedProduct = { name: '', barcode: '', quantity: 0 };
    this.isExistingProduct = false;
    this.currentStock = 0;
  }

  // Notification methods
  showNotification(message: string, type: 'success' | 'info' | 'error'): void {
    this.notification = message;
    this.notificationType = type;
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      this.hideNotification();
    }, 3000);
  }

  hideNotification(): void {
    this.notification = '';
    this.notificationType = '';
  }
}