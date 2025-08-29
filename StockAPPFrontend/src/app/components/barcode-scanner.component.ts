import { Component, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

// Extend MediaTrackConstraints to include torch property for better typing
interface ExtendedMediaTrackConstraints extends MediaTrackConstraints {
  torch?: boolean;
}

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
  template: `
    <div class="scanner-container" *ngIf="isScanning">
      <div class="scanner-header">
        <h3>Scan Barcode</h3>
        <button class="close-btn" (click)="stopScanning()">×</button>
      </div>
      
      <div class="scanner-wrapper">
        <zxing-scanner
          #scanner
          [formats]="allowedFormats"
          [enable]="isScanning"
          [torch]="torchEnabled"
          (scanSuccess)="onCodeResult($event)"
          (scanError)="onScanError($event)"
          (permissionResponse)="onPermissionResponse($event)">
        </zxing-scanner>
      </div>
      
      <div class="scanner-controls">
        <button (click)="toggleTorch()" [disabled]="!torchAvailable">
          {{ torchEnabled ? 'Turn Off Flash' : 'Turn On Flash' }}
          <span *ngIf="isIOS && !torchAvailable" class="ios-note">(Not available on iOS)</span>
        </button>
        <button (click)="stopScanning()">Cancel</button>
      </div>
      
      <div class="scanner-info">
        <p>Point your camera at a barcode to scan it</p>
        <p *ngIf="isIOS" class="ios-tip">💡 For better results on iOS, ensure good lighting or use the flashlight manually</p>
      </div>
    </div>
  `,
  styles: [`
    .scanner-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }

    .scanner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #333;
      color: white;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 2rem;
      cursor: pointer;
      padding: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .scanner-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      min-height: 0;
    }

    .scanner-controls {
      padding: 1rem;
      display: flex;
      gap: 1rem;
      justify-content: center;
      background: #333;
    }

    .scanner-controls button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      background: #007bff;
      color: white;
      cursor: pointer;
    }

    .scanner-controls button:disabled {
      background: #666;
      cursor: not-allowed;
    }

    .ios-note {
      font-size: 0.8rem;
      opacity: 0.8;
      font-style: italic;
    }

    .scanner-info {
      padding: 1rem;
      text-align: center;
      color: white;
      background: #333;
    }

    .ios-tip {
      font-size: 0.9rem;
      color: #ffd700;
      margin-top: 0.5rem;
    }

    ::ng-deep zxing-scanner {
      width: 100%;
      max-width: 400px;
      height: 60vh;
      min-height: 300px;
      max-height: 500px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);

      @media (max-width: 768px) {
        height: 50vh;
        min-height: 250px;
        max-height: 400px;
        max-width: 95%;
      }

      @media (orientation: landscape) and (max-height: 500px) {
        height: 70vh;
        min-height: 200px;
      }
    }

    ::ng-deep zxing-scanner video {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover;
      border-radius: 12px;
    }
  `]
})
export class BarcodeScannerComponent implements OnDestroy {
  @Output() barcodeScanned = new EventEmitter<string>();
  @Output() scannerClosed = new EventEmitter<void>();

  isScanning = false;
  torchEnabled = false;
  torchAvailable = false;
  isIOS = false;
  
  allowedFormats = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39
  ];

  constructor() {
    // Detect iOS devices
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  startScanning(): void {
    this.isScanning = true;
    this.checkTorchAvailability();
  }

  stopScanning(): void {
    // Turn off torch FIRST before stopping the camera
    this.disableTorch();
    this.isScanning = false;
    this.scannerClosed.emit();
  }

  onCodeResult(result: string): void {
    if (result) {
      // Turn off torch FIRST before stopping the camera
      this.disableTorch();
      this.barcodeScanned.emit(result);
      this.stopScanning();
    }
  }

  onScanError(error: any): void {
    console.error('Scan error:', error);
    // Turn off torch on scan error as well
    this.disableTorch();
  }

  onPermissionResponse(granted: boolean): void {
    if (!granted) {
      // Turn off torch if permission denied
      this.disableTorch();
      alert('Camera permission is required to scan barcodes');
      this.stopScanning();
    } else {
      this.checkTorchAvailability();
    }
  }

  async checkTorchAvailability(): Promise<void> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
        const constraints = navigator.mediaDevices.getSupportedConstraints();
        this.torchAvailable = !!(constraints as any).torch;
        
        // For iOS, try to get media stream to check torch support
        if (this.isIOS) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities();
          this.torchAvailable = !!(capabilities as any).torch;
          stream.getTracks().forEach(track => track.stop());
        }
      }
    } catch (error) {
      console.warn('Could not check torch availability:', error);
      this.torchAvailable = false;
    }
  }

  async toggleTorch(): Promise<void> {
    if (!this.torchAvailable) {
      if (this.isIOS) {
        this.showIOSFlashMessage();
      }
      return;
    }

    try {
      this.torchEnabled = !this.torchEnabled;
      
      // For iOS, we need to handle torch differently
      if (this.isIOS) {
        await this.toggleIOSTorch();
      }
    } catch (error) {
      console.error('Error toggling torch:', error);
      this.torchEnabled = false;
      if (this.isIOS) {
        this.showIOSFlashMessage();
      }
    }
  }

  private async toggleIOSTorch(): Promise<void> {
    try {
      // Create video constraints with extended interface
      const videoConstraints: ExtendedMediaTrackConstraints = {
        facingMode: 'environment'
      };
      
      // Add torch constraint if enabled
      if (this.torchEnabled) {
        videoConstraints.torch = true;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });
      // The stream is handled by zxing-scanner, we just need to set the constraint
    } catch (error) {
      console.warn('iOS torch toggle failed:', error);
      this.showIOSFlashMessage();
    }
  }

  private async disableTorch(): Promise<void> {
    if (!this.torchEnabled) return; // Already disabled
    
    try {
      // Set the property first
      this.torchEnabled = false;
      
      // For iOS devices, apply torch=false constraint explicitly
      if (this.isIOS && this.torchAvailable) {
        const videoConstraints: ExtendedMediaTrackConstraints = {
          facingMode: 'environment',
          torch: false
        };
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints
        });
        
        // Apply the constraint to existing tracks if possible
        const tracks = stream.getVideoTracks();
        if (tracks.length > 0) {
          await tracks[0].applyConstraints(videoConstraints);
        }
        
        // Clean up the temporary stream
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.warn('Failed to disable torch:', error);
      // Ensure the property is still set to false even if constraint application fails
      this.torchEnabled = false;
    }
  }

  private showIOSFlashMessage(): void {
    alert('Flash control may not be available on this device. Try using the built-in camera app or adjusting your lighting manually.');
  }

  ngOnDestroy(): void {
    // Turn off torch FIRST before stopping scanner
    this.disableTorch();
    this.stopScanning();
  }
}
