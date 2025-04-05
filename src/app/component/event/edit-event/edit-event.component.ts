import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';

@Component({
  selector: 'app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.scss'],
  imports: [
    FormsModule, CommonModule, LucideAngularModule
  ]
})
export class EditEventComponent implements OnInit {
  categories = [
    {name: '', places: 0}
  ];
  amisString: string = ''; // Propriété intermédiaire pour les amis
  categoriesString: string = ''; // Propriété intermédiaire
  @Input() isVisible = false; // Contrôle de visibilité
  @Input() event: any = {}; // Données de l'événement
  @Output() saveEvent = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();


  ngOnInit(): void {
    this.categoriesString = this.event.categories?.join(', ') || ''; // Convertit le tableau en chaîne
    this.amisString = this.event.amis?.join(', ') || '';
    // Initialisation des catégories depuis l'événement
    this.categories = this.event.categories ? [...this.event.categories] : [];
  }

  addCategory() {
    this.categories.push({name: '', places: 0});
  }

  removeCategory(index: number) {
    this.categories.splice(index, 1);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  closeModal(): void {
    this.isVisible = false;
    this.close.emit();
  }

  save(): void {
    // Synchronise les catégories avec l'objet événement avant la sauvegarde
    this.event.categories = [...this.categories];
    this.saveEvent.emit(this.event); // Émet les données mises à jour au parent
    this.closeModal();
  }
}
