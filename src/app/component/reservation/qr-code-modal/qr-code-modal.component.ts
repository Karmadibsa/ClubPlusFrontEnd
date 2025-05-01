import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {QRCodeComponent} from 'angularx-qrcode';


@Component({
  selector: 'app-qr-code-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, QRCodeComponent],
  templateUrl: './qr-code-modal.component.html',
  styleUrls: ['./qr-code-modal.component.scss']
})
export class QrCodeModalComponent {
  @Input() isOpen: boolean = false;
  @Input() ticketInfo: any | null = null; // Doit correspondre à l'objet reservation
  @Input() qrData: string = '';
  @Output() close = new EventEmitter<void>(); // Renommé de closeModal à close

  onClose(): void {
    this.close.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
