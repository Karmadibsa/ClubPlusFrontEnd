import {Component, EventEmitter, Input, Output} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {DatePipe, NgIf} from '@angular/common';
import {EditMembreComponent} from '../edit-membre/edit-membre.component';

@Component({
  selector: '[app-membre-row]',
  templateUrl: './membre-row.component.html',
  imports: [
    LucideAngularModule,
    NgIf,
    EditMembreComponent,
    DatePipe
  ],
  styleUrls: ['./membre-row.component.scss']
})
export class MembreRowComponent {
  @Input() membre: any;
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  isEditModalVisible = false;

  openEditModal(): void {
    this.isEditModalVisible = true;
  }

  closeEditModal(): void {
    this.isEditModalVisible = false;
  }

// Dans membre-row.component.ts
  onSave(memberUpdates: any): void {
    // Émettre l'événement au parent
    this.edit.emit(memberUpdates);
  }


  onDelete(): void {
    this.delete.emit(this.membre);
  }
}
