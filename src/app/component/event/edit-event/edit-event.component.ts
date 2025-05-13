// Importations nécessaires pour Angular, les formulaires, les icônes, etc.
import {
  ChangeDetectionStrategy, // Stratégie pour optimiser la détection de changements
  ChangeDetectorRef,       // Outil pour contrôler la détection de changements
  Component,
  EventEmitter,
  inject,                   // Fonction moderne pour l'injection de dépendances
  Input,
  numberAttribute,          // Transformation pour les @Input numériques
  OnChanges,
  OnInit,
  Output,
  SimpleChanges             // Type pour l'objet 'changes' dans ngOnChanges
} from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common'; // CommonModule (*ngIf...), DatePipe (formater les dates)
import { LucideAngularModule } from 'lucide-angular'; // Pour utiliser les icônes Lucide

// Importations de vos services et modèles (interfaces) - Adaptez les chemins si nécessaire
import { EventService } from '../../../service/crud/event.service'; // Service pour interagir avec l'API des événements
import { CreateEventPayload, Evenement, UpdateEventPayload } from '../../../model/evenement';
import {CategorieCreatePayload, CategorieUpdatePayload} from '../../../model/categorie'; // Assurez-vous d'importer CategorieUpdatePayload si utilisé
import { AuthService } from '../../../service/security/auth.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-edit-event',     // Nom de la balise HTML pour utiliser ce composant: <app-edit-event>
  standalone: true,               // Indique que c'est un composant autonome (gère ses propres dépendances).
  imports: [
    CommonModule,                 // Requis pour *ngIf, *ngFor, le pipe 'date', etc.
    ReactiveFormsModule,          // INDISPENSABLE pour [formGroup], formControlName, formArrayName
    LucideAngularModule           // Pour les balises <lucide-icon>
  ],
  providers: [
    DatePipe                      // Le DatePipe doit être fourni pour pouvoir être injecté.
  ],
  templateUrl: './edit-event.component.html', // Chemin vers le fichier HTML de ce composant.
  styleUrls: ['./edit-event.component.scss'],  // Chemin vers le fichier de style de ce composant.
  changeDetection: ChangeDetectionStrategy.OnPush // Optionnel: Si vous optimisez la détection de changements.
  // Si OnPush est utilisé, l'usage de cdr.detectChanges() est plus justifié.
})
export class EditEventModalComponent implements OnInit, OnChanges {

  /**
   * @Input() isVisible
   * Le composant parent contrôle la visibilité de cette modale via cette propriété.
   * Un `*ngIf="isVisible"` est probablement utilisé dans le template du parent ou de ce composant.
   */
  @Input() isVisible = false;

  /**
   * @Input() event
   * L'objet `Evenement` à modifier.
   * - Si un objet `Evenement` est fourni, le composant passe en mode ÉDITION.
   * - Si `undefined` ou `null`, le composant passe en mode CRÉATION.
   */
  @Input() event?: Evenement; // L'utilisation de `?` rend la propriété optionnelle.

  /**
   * @Input() clubId
   * L'ID du club auquel l'événement sera associé.
   * Principalement nécessaire en mode CRÉATION.
   * `transform: numberAttribute` assure que la valeur passée (même une chaîne) est convertie en nombre.
   */
  @Input({ transform: numberAttribute }) clubId?: number;

  // --- --------------------------------- ---
  // --- OUTPUTS (Événements vers le parent) ---
  // --- --------------------------------- ---

  /**
   * @Output() saveSuccess
   * Émis lorsque l'événement est sauvegardé (créé ou modifié) avec succès via l'API.
   * Renvoie l'objet `Evenement` résultant (avec son ID si c'est une création).
   */
  @Output() saveSuccess = new EventEmitter<Evenement>();

  /**
   * @Output() close
   * Émis lorsque l'utilisateur demande explicitement la fermeture de la modale
   * (ex: clic sur un bouton "Annuler", "Fermer", ou l'icône de fermeture de la modale).
   * Le parent écoutera cet événement pour mettre `isVisible` à `false`.
   */
  @Output() close = new EventEmitter<void>(); // `void` car aucune donnée n'est émise.

  // --- ------------------------------------- ---
  // --- SERVICES INJECTÉS (Outils externes) ---
  // --- ------------------------------------- ---

  private fb = inject(FormBuilder);              // Pour construire des formulaires réactifs.
  private eventService = inject(EventService);    // Pour les appels API liés aux événements.
  private notificationService = inject(SweetAlertService); // Pour afficher des notifications (succès/erreur).
  private datePipe = inject(DatePipe);            // Pour formater les dates pour les inputs HTML.
  private cdr = inject(ChangeDetectorRef);        // Pour contrôler manuellement la détection de changements.
  private authService = inject(AuthService);      // Pour récupérer l'ID du club de l'utilisateur gérant.

  // --- ----------------------------------- ---
  // --- PROPRIÉTÉS INTERNES DU COMPOSANT ---
  // --- ----------------------------------- ---

  /**
   * @property eventForm
   * Le `FormGroup` principal qui encapsule tous les contrôles du formulaire.
   * Le `!` (definite assignment assertion) indique à TypeScript que cette propriété
   * sera initialisée de manière certaine (dans `ngOnInit`) avant toute utilisation.
   */
  eventForm!: FormGroup;

  /**
   * @property isSaving
   * Booléen pour suivre l'état d'une opération de sauvegarde (appel API).
   * Utile pour désactiver le bouton "Enregistrer" et/ou afficher un indicateur de chargement.
   */
  isSaving = false;

  /**
   * @property isEditMode
   * Détermine si la modale est en mode 'Création' ou 'Modification'.
   * Mis à jour dynamiquement dans `ngOnChanges` en fonction de la présence de `this.event`.
   */
  isEditMode = false;

  // --- --------------------------------------- ---
  // --- MÉTHODES DU CYCLE DE VIE ANGULAR ---
  // --- --------------------------------------- ---

  /**
   * `ngOnInit` est appelée par Angular UNE SEULE FOIS après la création du composant
   * et après que les premières valeurs des `@Input` aient été définies.
   * C'est l'endroit idéal pour effectuer des initialisations qui ne dépendent pas
   * des changements ultérieurs des `@Input` (comme la création de la structure du formulaire).
   */
  ngOnInit(): void {
    this.initForm(); // Initialise la structure du formulaire.
  }

  /**
   * `ngOnChanges` est appelée par Angular AVANT `ngOnInit` (pour les changements initiaux des @Input)
   * et ensuite CHAQUE FOIS qu'une ou plusieurs propriétés `@Input` du composant changent de valeur.
   * C'est ici qu'on réagit à l'arrivée ou au changement de l'@Input 'event' pour
   * déterminer le mode (création/édition) et remplir le formulaire si nécessaire.
   * @param changes Un objet `SimpleChanges` qui contient les valeurs actuelles et précédentes
   *                des propriétés `@Input` qui ont changé.
   */
  ngOnChanges(changes: SimpleChanges): void {
    console.log('[Modal ngOnChanges] Changements détectés:', changes);

    // Réagir si l'@Input 'event' a changé.
    if (changes['event']) {
      console.log('[Modal ngOnChanges] Valeur de @Input event:', this.event);
      if (this.event && this.event.id) { // Vérifie aussi la présence d'un ID pour être sûr que c'est une édition
        this.isEditMode = true;
        if (this.eventForm) { // S'assurer que le formulaire est déjà initialisé
          this.populateFormForEdit();
        }
      } else {
        this.isEditMode = false;
        if (this.eventForm) {
          this.eventForm.reset(); // Réinitialise les valeurs du formulaire.
          this.categoriesFormArray.clear(); // Vide le FormArray des catégories.
        }
      }
    }

    // Si la modale devient visible et que le formulaire n'a pas encore été initialisé
    // (ce qui pourrait arriver si ngOnInit n'a pas encore été exécuté, ou si le formulaire a été détruit).
    if (changes['isVisible']?.currentValue === true && !this.eventForm) {
      this.initForm();
      // Si on est en mode édition et qu'un événement est fourni, on le charge.
      if (this.isEditMode && this.event) {
        this.populateFormForEdit();
      }
    }
  }

  // --- ------------------------------------- ---
  // --- LOGIQUE DE GESTION DU FORMULAIRE ---
  // --- ------------------------------------- ---

  /**
   * Initialise la structure du `FormGroup` principal `eventForm` avec ses `FormControl`
   * et `FormArray`, ainsi que leurs validateurs.
   */
  initForm(): void {
    this.eventForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      start: ['', Validators.required], // La valeur sera une chaîne formatée pour datetime-local
      end: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      location: ['', Validators.maxLength(255)],
      // `categories` est un FormArray, car un événement peut avoir plusieurs catégories.
      // Il est requis d'avoir au moins une catégorie (Validators.required sur le FormArray).
      categories: this.fb.array([], [Validators.required, Validators.minLength(1)]) // Assure au moins une catégorie
    }, {
      // Validateur appliqué au niveau du FormGroup pour vérifier la cohérence entre plusieurs champs.
      validators: this.dateOrderValidator
    });
  }

  /**
   * Remplit le formulaire `eventForm` avec les données d'un événement existant (`this.event`).
   * Appelée par `ngOnChanges` lorsqu'un événement est fourni via `@Input() event`.
   */
  populateFormForEdit(): void {
    if (!this.event) return; // Sécurité : ne rien faire si this.event est undefined.
    console.log('[Modal populateForm] Événement à utiliser pour l\'édition:', this.event);

    const eventData = this.event; // Pour la clarté et la portée dans setTimeout.

    // Format requis par <input type="datetime-local"> : "YYYY-MM-DDTHH:mm"
    const formatForInput = 'yyyy-MM-ddTHH:mm';
    // Utilise DatePipe pour formater les dates (venant de l'API) au format attendu par l'input.
    // `?? ''` fournit une chaîne vide si `transform` retourne `null` (date invalide).
    const formattedStart = this.datePipe.transform(eventData.start, formatForInput) ?? '';
    const formattedEnd = this.datePipe.transform(eventData.end, formatForInput) ?? '';
    console.log('[Modal populateForm] Dates formatées pour input (start, end):', formattedStart, formattedEnd);
    setTimeout(() => {
      // `patchValue` met à jour les valeurs des contrôles du formulaire.
      // Il ne met à jour que les champs présents dans l'objet fourni.
      this.eventForm.patchValue({
        nom: eventData.nom,
        start: formattedStart,
        end: formattedEnd,
        description: eventData.description,
        location: eventData.location || '' // Utilise une chaîne vide si location est null/undefined.
      });
      console.log('[Modal populateForm (dans setTimeout)] Valeurs du formulaire après patchValue:', this.eventForm.value);

      // Remplissage du FormArray des catégories.
      this.categoriesFormArray.clear(); // Vide le FormArray pour éviter les doublons si populateFormForEdit est appelé plusieurs fois.
      console.log('[Modal populateForm (dans setTimeout)] FormArray des catégories vidé.');
      eventData.categories.forEach(cat => {
        console.log('[Modal populateForm (dans setTimeout)] Ajout de la catégorie au FormArray:', cat);
        // Pour chaque catégorie de l'événement, crée un FormGroup et l'ajoute au FormArray.
        const categoryGroup = this.createCategoryGroup(cat.id, cat.nom, cat.capacite);
        this.categoriesFormArray.push(categoryGroup);
      });
      console.log('[Modal populateForm (dans setTimeout)] Valeur du FormArray des catégories après remplissage:', this.categoriesFormArray.value);

      // `this.cdr.detectChanges()`:
      // Force explicitement Angular à exécuter la détection de changements pour ce composant et ses enfants.
      // Nécessaire ici à cause de `setTimeout` (qui exécute le code en dehors du cycle de détection
      // de changements standard qui a déclenché `ngOnChanges`) et pour assurer la mise à jour
      // de la vue si `ChangeDetectionStrategy.OnPush` est utilisée.
      console.log('[Modal populateForm (dans setTimeout)] Forçage de la détection de changements...');
      this.cdr.detectChanges();
    }, 0); // Le délai de 0ms signifie "dès que possible".
  }

  /**
   * Getter pratique pour accéder facilement au `FormArray` 'categories' depuis le code TypeScript
   * et, plus important encore, depuis le template HTML (ex: `*ngFor="let catCtrl of categoriesFormArray.controls"`).
   */
  get categoriesFormArray(): FormArray {
    return this.eventForm.get('categories') as FormArray; // 'as FormArray' est un cast de type.
  }

  /**
   * Crée et retourne un `FormGroup` représentant une seule catégorie, avec ses contrôles et validateurs.
   * Utilisé pour initialiser les catégories lors de l'édition (`populateFormForEdit`)
   * et pour ajouter de nouvelles catégories (`addCategory`).
   * @param id L'ID de la catégorie (vient de l'API si existante, `null` pour une nouvelle catégorie).
   *           Cet ID est crucial pour le backend lors de la mise à jour de l'événement.
   * @param nom Le nom initial de la catégorie.
   * @param capacite La capacité initiale de la catégorie.
   * @returns Un `FormGroup` configuré pour une catégorie.
   */
  createCategoryGroup(id: number | null = null, nom: string = '', capacite: number | null = null): FormGroup {
    return this.fb.group({
      id: [id], // Le champ 'id' n'est généralement pas affiché à l'utilisateur mais est envoyé au backend.
      nom: [nom, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      capacite: [capacite, [Validators.required, Validators.min(0)]] // Capacité doit être un nombre positif ou nul.
    });
  }

  /**
   * Ajoute un nouveau `FormGroup` (représentant une catégorie vide avec `id: null`)
   * au `FormArray` 'categories'.
   * Généralement appelée par un bouton "Ajouter une catégorie" dans le template HTML.
   */
  addCategory(): void {
    const newCategoryGroup = this.createCategoryGroup(); // Crée un groupe de catégorie vide.
    this.categoriesFormArray.push(newCategoryGroup); // L'ajoute au FormArray.
    this.cdr.detectChanges(); // Assurer la mise à jour de la vue, surtout si OnPush.
  }

  /**
   * Supprime un `FormGroup` de catégorie du `FormArray` à une position (index) donnée.
   * Généralement appelée par un bouton "Supprimer" à côté de chaque catégorie dans le template.
   * @param index La position de la catégorie à supprimer dans le FormArray.
   */
  removeCategory(index: number): void {
    this.categoriesFormArray.removeAt(index);
    this.cdr.detectChanges(); // Assurer la mise à jour de la vue.
  }

  /**
   * Validateur personnalisé appliqué au `FormGroup` principal (`eventForm`).
   * Vérifie si la date de début (`start`) est bien antérieure à la date de fin (`end`).
   * @param control Le contrôle auquel ce validateur est attaché (ici, c'est `eventForm`).
   * @returns Un objet d'erreur `{ 'dateOrderInvalid': true }` si la validation échoue (start >= end),
   *          sinon `null` (validation réussie).
   */
  dateOrderValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const startValue = control.get('start')?.value;
    const endValue = control.get('end')?.value;

    // Si les deux dates sont présentes et que la date de début est égale ou postérieure à la date de fin...
    if (startValue && endValue && new Date(startValue) >= new Date(endValue)) {
      return { 'dateOrderInvalid': true }; // ...signaler une erreur.
    }
    return null; // ...sinon, la validation de l'ordre des dates est réussie.
  }

  // --- ------------------------- ---
  // --- LOGIQUE DE SAUVEGARDE ---
  // --- ------------------------- ---

  /**
   * Méthode principale appelée lorsque l'utilisateur soumet le formulaire (clic sur "Enregistrer").
   * Gère la logique de CRÉATION ou de MISE À JOUR de l'événement en fonction de `this.isEditMode`.
   */
  saveChanges(): void {
    // 1. Marquer tous les champs comme "touchés" pour afficher les messages d'erreur de validation s'il y en a.
    this.eventForm.markAllAsTouched();
    this.cdr.detectChanges(); // S'assurer que les messages d'erreur s'affichent si OnPush.

    // 2. Vérifier la validité globale du formulaire.
    if (this.eventForm.invalid) {
      this.notificationService.show('Formulaire invalide. Veuillez vérifier les champs en rouge.', 'warning');
      console.warn('Tentative de sauvegarde avec formulaire invalide:', this.eventForm.errors, this.eventForm.value);
      return; // Arrêter le processus si le formulaire n'est pas valide.
    }

    // 3. Activer l'indicateur de sauvegarde (pour UI : désactiver bouton, afficher spinner).
    this.isSaving = true;
    // this.cdr.detectChanges(); // Décommenter si un feedback visuel immédiat est nécessaire avec OnPush.

    // `getRawValue()` récupère toutes les valeurs du formulaire, y compris celles des champs désactivés
    // (bien qu'il n'y en ait pas ici, c'est une bonne pratique pour les formulaires complexes).
    const formValue = this.eventForm.getRawValue();

    // Fonction utilitaire pour formater les dates pour le backend.
    // L'input datetime-local omet les secondes. Si le backend les attend (ex: format ISO complet),
    // il faut les ajouter. Adapter ce format selon les besoins de votre API.
    const formatForBackend = (dateString: string): string => {
      return dateString ? new Date(dateString).toISOString() : ''; // Conversion en format ISO string UTC
      // Alternative si le backend attend spécifiquement YYYY-MM-DDTHH:MM:SS sans timezone:
      // return dateString ? dateString.replace('T', ' ') + ':00' : '';
    };

    // 4. Logique distincte pour la MISE À JOUR ou la CRÉATION.
    if (this.isEditMode && this.event?.id) {
      // --- MODE ÉDITION : Mise à jour d'un événement existant ---
      console.log('[Modal saveChanges] Mode ÉDITION. ID événement:', this.event.id);

      // Prépare le payload pour la mise à jour (UpdateEventPayload).
      const updatePayload: UpdateEventPayload = {
        nom: formValue.nom,
        start: formatForBackend(formValue.start),
        end: formatForBackend(formValue.end),
        description: formValue.description,
        location: formValue.location || undefined, // Envoie undefined si vide, pour que le backend puisse l'ignorer ou mettre à null.
        // Pour les catégories, on envoie la liste complète (avec ID pour les existantes, ID=null pour les nouvelles).
        // Le backend doit gérer la logique de création/mise à jour/suppression des catégories.
        categories: formValue.categories.map((cat: any) => ({
          id: cat.id, // L'ID est crucial ici.
          nom: cat.nom,
          capacite: cat.capacite
        })) as CategorieUpdatePayload[] // Cast vers le type attendu par l'API.
      };
      console.log('[Modal saveChanges] Appel UPDATE avec payload:', updatePayload);

      this.eventService.updateEventWithCategories(this.event.id, updatePayload)
        .subscribe({
          next: (updatedEvent) => {
            this.notificationService.show('Événement mis à jour avec succès!', 'success');
            this.isSaving = false;
            this.saveSuccess.emit(updatedEvent); // Émet l'événement mis à jour vers le parent.
            // La fermeture de la modale est généralement gérée par le parent en réponse à saveSuccess.
            // ou appeler this.closeModal() si la modale doit se fermer elle-même.
          },
          error: (err) => {
            console.error("Erreur lors de la mise à jour de l'événement:", err);
            this.notificationService.show(`Erreur lors de la mise à jour: ${err.message || 'Erreur inconnue'}`, 'error');
            this.isSaving = false;
            // this.cdr.detectChanges(); // Si OnPush et que l'état de isSaving doit être reflété.
          }
        });

    } else if (!this.isEditMode) {
      // --- MODE CRÉATION : Création d'un nouvel événement ---
      console.log('[Modal saveChanges] Mode CRÉATION.');

      // Récupère l'ID du club à partir de l'Input `clubId` ou, en fallback, de `AuthService`.
      // Il est préférable d'avoir une source claire et unique pour `clubId` en mode création.
      // L'Input `this.clubId` est normalement la source primaire si ce composant est bien utilisé.
      const organisateurClubId = this.clubId ?? this.authService.getManagedClubId();

      if (organisateurClubId === null || organisateurClubId === undefined) {
        console.error("Erreur: ID du club organisateur manquant pour la création.");
        this.notificationService.show("ID du club organisateur introuvable pour la création.", "error");
        this.isSaving = false;
        return; // Arrêter le processus.
      }
      console.log('[Modal saveChanges] ID Club pour création:', organisateurClubId);

      // Prépare le payload pour la création (CreateEventPayload).
      // Les catégories n'auront pas d'ID.
      const createCategoriesPayload: CategorieCreatePayload[] = formValue.categories.map((cat: any) => ({
        nom: cat.nom,
        capacite: cat.capacite
      }));

      const createPayload: CreateEventPayload = {
        nom: formValue.nom,
        start: formatForBackend(formValue.start),
        end: formatForBackend(formValue.end),
        description: formValue.description,
        location: formValue.location || undefined,
        categories: createCategoriesPayload
      };
      console.log('[Modal saveChanges] Appel CREATE pour club ID:', organisateurClubId, 'Payload:', createPayload);

      this.eventService.createEventWithCategories(organisateurClubId, createPayload)
        .subscribe({
          next: (createdEvent) => {
            this.notificationService.show('Événement créé avec succès!', 'success');
            this.isSaving = false;
            this.saveSuccess.emit(createdEvent); // Émet l'événement NOUVELLEMENT créé vers le parent.
          },
          error: (err) => {
            console.error("Erreur lors de la création de l'événement:", err);
            this.notificationService.show(`Erreur lors de la création: ${err.message || 'Erreur inconnue'}`, 'error');
            this.isSaving = false;
          }
        });
    } else {
      // Cas de sécurité si le mode n'est ni création ni édition (ne devrait pas arriver).
      console.error("Erreur interne: Mode de sauvegarde (création/édition) indéfini.");
      this.notificationService.show("Une erreur interne est survenue lors de la sauvegarde.", "error");
      this.isSaving = false;
    }
  }

  // --- ---------------- ---
  // --- FERMETURE ---
  // --- ---------------- ---

  /**
   * Méthode appelée pour demander la fermeture de la modale (ex: clic sur "Annuler" ou icône de fermeture).
   * Elle émet l'événement `close` pour que le composant parent puisse gérer la fermeture
   * (typiquement en mettant sa propriété qui contrôle `this.isVisible` à `false`).
   */
  closeModal(): void {
    // Optionnel: Empêcher la fermeture si une sauvegarde est en cours.
    if (this.isSaving) {
      // this.notificationService.show("Sauvegarde en cours, veuillez patienter...", "info");
      return;
    }
    this.close.emit(); // Émet l'événement de fermeture.
  }
}
