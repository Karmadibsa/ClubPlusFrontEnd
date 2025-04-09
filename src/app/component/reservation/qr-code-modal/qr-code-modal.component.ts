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
  @Input() qrData: string = '';
  @Input() ticketInfo: any;
  @Output() closeModal = new EventEmitter<void>();

  onClose() {
    this.closeModal.emit();
  }
}
