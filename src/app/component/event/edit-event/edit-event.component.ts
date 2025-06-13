import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  numberAttribute,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { EventService } from '../../../service/crud/event.service';
import { CreateEventPayload, Evenement, UpdateEventPayload } from '../../../model/evenement';
import { CategorieCreatePayload, CategorieUpdatePayload } from '../../../model/categorie';
import { AuthService } from '../../../service/security/auth.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

/**
 * Modale de création et de modification d'un événement.
 *
 * Ce composant gère la logique du formulaire réactif pour un événement et ses catégories.
 * Il opère en mode 'Création' ou 'Édition' selon que l'Input `event` est fourni ou non.
 * @see {@link Evenement}
 */
@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  providers: [
    DatePipe
  ],
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditEventModalComponent implements OnInit, OnChanges {

  // =================================================================================================
  // == INPUTS & OUTPUTS
  // =================================================================================================

  /** Contrôle la visibilité de la modale. */
  @Input() isVisible = false;

  /**
   * L'événement à modifier. S'il est `undefined`, le composant est en mode Création.
   */
  @Input() event?: Evenement;

  /** L'ID du club organisateur, requis pour la création d'un événement. */
  @Input({ transform: numberAttribute }) clubId?: number;

  /** Émis avec l'événement sauvegardé après une création ou une mise à jour réussie. */
  @Output() saveSuccess = new EventEmitter<Evenement>();

  /** Émis lorsque la fermeture de la modale est demandée. */
  @Output() close = new EventEmitter<void>();

  // =================================================================================================
  // == PROPRIÉTÉS
  // =================================================================================================

  /** Formulaire réactif principal. */
  public eventForm!: FormGroup;

  /** Vrai si une opération de sauvegarde est en cours. */
  public isSaving = false;

  /** Vrai si le composant est en mode Édition. */
  public isEditMode = false;

  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);
  private readonly notificationService = inject(SweetAlertService);
  private readonly datePipe = inject(DatePipe);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);

  // =================================================================================================
  // == CYCLE DE VIE
  // =================================================================================================

  /**
   * Initialise la structure du formulaire à la création du composant.
   */
  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Réagit aux changements des Inputs, notamment pour basculer entre les modes
   * Création et Édition.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['event']) {
      if (this.event && this.event.id) {
        this.isEditMode = true;
        if (this.eventForm) {
          this.populateFormForEdit();
        }
      } else {
        this.isEditMode = false;
        if (this.eventForm) {
          this.eventForm.reset();
          this.categoriesFormArray.clear();
        }
      }
    }

    if (changes['isVisible']?.currentValue === true && !this.eventForm) {
      this.initForm();
      if (this.isEditMode && this.event) {
        this.populateFormForEdit();
      }
    }
  }

  // =================================================================================================
  // == GESTION DU FORMULAIRE
  // =================================================================================================

  /**
   * Crée l'instance et la structure du `FormGroup` principal.
   */
  private initForm(): void {
    this.eventForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      location: ['', Validators.maxLength(255)],
      categories: this.fb.array([], [Validators.required, Validators.minLength(1)])
    }, {
      validators: this.dateOrderValidator
    });
  }

  /**
   * Remplit le formulaire avec les données d'un événement existant.
   */
  private populateFormForEdit(): void {
    if (!this.event) {
      return;
    }

    const formatForInput = 'yyyy-MM-ddTHH:mm';
    const formattedStart = this.datePipe.transform(this.event.startTime, formatForInput) ?? '';
    const formattedEnd = this.datePipe.transform(this.event.endTime, formatForInput) ?? '';

    setTimeout(() => {
      this.eventForm.patchValue({
        nom: this.event!.nom,
        startTime: formattedStart,
        endTime: formattedEnd,
        description: this.event!.description,
        location: this.event!.location || ''
      });

      this.categoriesFormArray.clear();
      this.event!.categories.forEach(cat => {
        const categoryGroup = this.createCategoryGroup(cat.id, cat.nom, cat.capacite);
        this.categoriesFormArray.push(categoryGroup);
      });

      this.cdr.detectChanges();
    }, 0);
  }

  /**
   * Accesseur pour le FormArray des catégories.
   */
  get categoriesFormArray(): FormArray {
    return this.eventForm.get('categories') as FormArray;
  }

  /**
   * Crée un `FormGroup` pour une seule catégorie.
   * @param id - L'ID de la catégorie (existant en mode édition, `null` sinon).
   * @param nom - Le nom initial de la catégorie.
   * @param capacite - La capacité initiale de la catégorie.
   */
  private createCategoryGroup(id: number | null = null, nom: string = '', capacite: number | null = null): FormGroup {
    return this.fb.group({
      id: [id],
      nom: [nom, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      capacite: [capacite, [Validators.required, Validators.min(0)]]
    });
  }

  /**
   * Ajoute une nouvelle catégorie vide au formulaire.
   */
  public addCategory(): void {
    this.categoriesFormArray.push(this.createCategoryGroup());
    this.cdr.detectChanges();
  }

  /**
   * Supprime une catégorie du formulaire à un index donné.
   * @param index - La position de la catégorie à supprimer.
   */
  public removeCategory(index: number): void {
    this.categoriesFormArray.removeAt(index);
    this.cdr.detectChanges();
  }

  /**
   * Validateur personnalisé qui vérifie que la date de début est antérieure à la date de fin.
   * @param control - Le `FormGroup` à valider.
   */
  private dateOrderValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const startValue = control.get('startTime')?.value;
    const endValue = control.get('endTime')?.value;

    if (startValue && endValue && new Date(startValue) >= new Date(endValue)) {
      return { 'dateOrderInvalid': true };
    }
    return null;
  }

  // =================================================================================================
  // == ACTIONS
  // =================================================================================================

  /**
   * Gère la soumission du formulaire pour créer ou mettre à jour un événement.
   */
  public saveChanges(): void {
    this.eventForm.markAllAsTouched();
    this.cdr.detectChanges();

    if (this.eventForm.invalid) {
      this.notificationService.show('Formulaire invalide. Veuillez vérifier les champs en rouge.', 'warning');
      return;
    }

    this.isSaving = true;
    const formValue = this.eventForm.getRawValue();

    const formatForBackend = (dateString: string): string => {
      return dateString ? new Date(dateString).toISOString() : '';
    };

    if (this.isEditMode && this.event?.id) {
      const updatePayload: UpdateEventPayload = {
        nom: formValue.nom,
        startTime: formatForBackend(formValue.startTime),
        endTime: formatForBackend(formValue.endTime),
        description: formValue.description,
        location: formValue.location || undefined,
        categories: formValue.categories.map((cat: any) => ({
          id: cat.id,
          nom: cat.nom,
          capacite: cat.capacite
        })) as CategorieUpdatePayload[]
      };

      this.eventService.updateEventWithCategories(this.event.id, updatePayload)
        .subscribe({
          next: (updatedEvent) => {
            this.notificationService.show('Événement mis à jour avec succès !', 'success');
            this.isSaving = false;
            this.saveSuccess.emit(updatedEvent);
          },
          error: (err) => {
            this.notificationService.show(`Erreur lors de la mise à jour: ${err.message || 'Erreur inconnue'}`, 'error');
            this.isSaving = false;
            this.cdr.detectChanges();
          }
        });
    } else {
      const organisateurClubId = this.clubId ?? this.authService.getManagedClubId();

      if (organisateurClubId === null || organisateurClubId === undefined) {
        this.notificationService.show("ID du club organisateur introuvable pour la création.", "error");
        this.isSaving = false;
        return;
      }

      const createPayload: CreateEventPayload = {
        nom: formValue.nom,
        startTime: formatForBackend(formValue.startTime),
        endTime: formatForBackend(formValue.endTime),
        description: formValue.description,
        location: formValue.location || undefined,
        categories: formValue.categories.map((cat: any) => ({
          nom: cat.nom,
          capacite: cat.capacite
        })) as CategorieCreatePayload[]
      };

      this.eventService.createEventWithCategories(organisateurClubId, createPayload)
        .subscribe({
          next: (createdEvent) => {
            this.notificationService.show('Événement créé avec succès !', 'success');
            this.isSaving = false;
            this.saveSuccess.emit(createdEvent);
          },
          error: (err) => {
            this.notificationService.show(`Erreur lors de la création: ${err.message || 'Erreur inconnue'}`, 'error');
            this.isSaving = false;
            this.cdr.detectChanges();
          }
        });
    }
  }

  /**
   * Émet l'événement pour fermer la modale.
   */
  public closeModal(): void {
    if (this.isSaving) {
      return;
    }
    this.close.emit();
  }
}
