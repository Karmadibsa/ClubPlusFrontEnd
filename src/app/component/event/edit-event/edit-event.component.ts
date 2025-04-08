import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.scss'],
  imports: [
    FormsModule, CommonModule, LucideAngularModule
  ]
})
export class EditEventComponent {
  @Input() isVisible = false;
  @Input() event: any = {};
  @Output() saveEvent = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
  constructor(private http: HttpClient) {}

  categories: any[] = [];
  eventCopy: any = {};

  ngOnInit(): void {
    // Créer une copie profonde pour éviter de modifier l'original
    this.eventCopy = JSON.parse(JSON.stringify(this.event));
    this.categories = this.eventCopy.categories || [];

    // S'assurer qu'il y a au moins une catégorie
    if (this.categories.length === 0) {
      this.addCategory();
    }
  }

  addCategory(): void {
    this.categories.push({ nom: '', places: 0 });
  }

  removeCategory(index: number): void {
    this.categories.splice(index, 1);
  }

  trackByIndex(index: number): number {
    return index;
  }

  closeModal(): void {
    this.close.emit();
  }

  save(): void {
    // Synchronise les catégories avec l'objet événement
    this.eventCopy.categories = [...this.categories];

    // Émet l'événement avec les données mises à jour
    this.saveEvent.emit(this.eventCopy);

    // Ferme la modal
    this.closeModal();
  }

}
