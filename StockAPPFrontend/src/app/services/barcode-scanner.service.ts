import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OpenFoodFactsProduct {
  code: string;
  product: {
    product_name: string;
    brands: string;
    categories: string;
    image_url: string;
    nutriscore_grade?: string;
    ecoscore_grade?: string;
  };
  status: number;
  status_verbose: string;
}

@Injectable({
  providedIn: 'root'
})
export class BarcodeScannerService {
  private readonly openFoodFactsBaseUrl = 'https://world.openfoodfacts.net';
  private readonly auth = btoa('off:off'); // Basic auth for staging

  constructor(private http: HttpClient) {}

  getProductByBarcode(barcode: string): Observable<OpenFoodFactsProduct> {
    const headers = new HttpHeaders({
      'Authorization': `Basic ${this.auth}`,
      'User-Agent': 'StockApp/1.0 (contact@stockapp.com)'
    });

    return this.http.get<OpenFoodFactsProduct>(
      `${this.openFoodFactsBaseUrl}/api/v2/product/${barcode}.json`,
      { headers }
    );
  }
}
