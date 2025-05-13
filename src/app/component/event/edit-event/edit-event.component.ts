// Importations nécessaires pour Angular, les formulaires, les icônes, etc.
import {
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
import {AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule, DatePipe} from '@angular/common'; // CommonModule (*ngIf...), DatePipe (formater les dates)
import {LucideAngularModule} from 'lucide-angular'; // Pour utiliser les icônes Lucide
// Importations de vos services et modèles (interfaces) - Adaptez les chemins si nécessaire
import {EventService} from '../../../service/crud/event.service'; // Service pour interagir avec l'API des événements
// Importez les interfaces définissant la structure des données événement/catégorie
import {CreateEventPayload, Evenement, UpdateEventPayload} from '../../../model/evenement';
import {CategorieCreatePayload} from '../../../model/categorie';
import {AuthService} from '../../../service/security/auth.service';
import {SweetAlertService} from '../../../service/sweet-alert.service'; // On importe aussi les types spécifiques aux payloads API

@Component({
  selector: 'app-edit-event',     // Nom de la balise HTML pour utiliser ce composant: <app-edit-event>
  standalone: true,               // Composant "autonome" (approche moderne, gère ses propres dépendances)
  imports: [
    CommonModule,                 // Requis pour *ngIf, *ngFor, le pipe 'date', etc.
    ReactiveFormsModule,          // INDISPENSABLE pour [formGroup], formControlName, formArrayName
    LucideAngularModule           // Pour les balises <lucide-icon>
  ],
  providers: [
    DatePipe                      // Doit être listé ici pour pouvoir être injecté via inject() ou constructeur
  ],
  templateUrl: './edit-event.component.html', // Chemin vers le fichier HTML de ce composant
  styleUrls: ['./edit-event.component.scss']  // Chemin vers le fichier de style de ce composant
})
export class EditEventModalComponent implements OnInit, OnChanges {

  // --- -------------------------------- ---
  // --- INPUTS (Données venant du parent) ---
  // --- -------------------------------- ---

  /** Le parent contrôle la visibilité de la modale via ce booléen */
  @Input() isVisible = false;

  /**
   * L'événement à modifier.
   * Si cet @Input reçoit une valeur (un objet Evenement), on est en mode ÉDITION.
   * Si cet @Input est undefined ou null, on est en mode CRÉATION.
   */
  @Input() event: Evenement | undefined;

  /**
   * L'ID du club auquel associer l'événement.
   * Nécessaire SEULEMENT en mode CRÉATION pour savoir où créer l'événement.
   */
  @Input({transform: numberAttribute}) clubId?: number;

  // --- --------------------------------- ---
  // --- OUTPUTS (Événements vers le parent) ---
  // --- --------------------------------- ---

  /** Émis lorsque l'événement est sauvegardé (créé ou modifié) avec succès. Renvoie l'objet événement résultant. */
  @Output() saveSuccess = new EventEmitter<Evenement>();

  /** Émis lorsque l'utilisateur demande la fermeture de la modale (bouton Annuler, clic overlay, etc.). */
  @Output() close = new EventEmitter<void>();

  // --- ------------------------------------- ---
  // --- SERVICES INJECTÉS (Outils externes) ---
  // --- ------------------------------------- ---

  // inject() est une manière moderne d'obtenir des instances de services/outils définis ailleurs
  private fb = inject(FormBuilder);                   // Outil Angular pour construire des formulaires complexes facilement
  private eventService = inject(EventService);         // Notre service pour communiquer avec l'API backend des événements
  private notificationService = inject(SweetAlertService); // Notre service pour afficher des messages (succès, erreur)
  private datePipe = inject(DatePipe);                 // Outil Angular pour formater les dates (ex: pour l'input datetime-local)
  private cdr = inject(ChangeDetectorRef);             // Outil pour déclencher manuellement la détection de changements d'Angular
  private authService = inject(AuthService)

  // --- ----------------------------------- ---
  // --- PROPRIÉTÉS INTERNES DU COMPOSANT ---
  // --- ----------------------------------- ---

  /**
   * La variable principale qui contient toute la structure et les valeurs de notre formulaire.
   * Le '!' indique à TypeScript qu'on est sûr qu'elle sera initialisée (dans ngOnInit) avant d'être utilisée.
   */
  eventForm!: FormGroup;

  /** Pour savoir si une opération de sauvegarde (appel API) est en cours. Utile pour désactiver le bouton "Enregistrer". */
  isSaving = false;

  /** Détermine si la modale est en mode 'Création' ou 'Modification'. Mis à jour dans ngOnChanges. */
  isEditMode = false;

  // --- --------------------------------------- ---
  // --- MÉTHODES DU CYCLE DE VIE ANGULAR ---
  // --- --------------------------------------- ---

  /**
   * ngOnInit est appelée par Angular UNE SEULE FOIS après la création du composant et l'initialisation des @Input.
   * C'est l'endroit idéal pour initialiser le formulaire.
   */
  ngOnInit(): void {
    this.initForm(); // Crée la structure vide du formulaire.
  }

  /**
   * ngOnChanges est appelée par Angular AVANT ngOnInit et CHAQUE FOIS qu'un @Input change de valeur.
   * C'est ici qu'on réagit à l'arrivée de l'@Input 'event' pour passer en mode édition et remplir le formulaire.
   * @param changes Objet contenant les @Input qui ont changé.
   */
  ngOnChanges(changes: SimpleChanges): void {
    console.log('[Modal ngOnChanges] Changements détectés:', changes); // Log utile pour le débogage

    // Vérifie si l'@Input 'event' a changé
    if (changes['event']) {
      console.log('[Modal ngOnChanges] Valeur de @Input event:', this.event); // Log utile

      // CAS 1: On reçoit un objet 'event' (ou il change pour un nouvel objet event)
      if (this.event) {
        this.isEditMode = true;   // On passe en mode ÉDITION
        // Si le formulaire est déjà initialisé (normalement oui grâce à ngOnInit)...
        if (this.eventForm) {
          this.populateFormForEdit(); // ... on remplit le formulaire avec les données reçues.
        }
        // CAS 2: L'@Input 'event' devient undefined/null (ex: le parent change d'avis)
      } else {
        this.isEditMode = false;  // On passe (ou reste) en mode CRÉATION
        // Si le formulaire existe déjà...
        if (this.eventForm) {
          this.eventForm.reset(); // ... on le vide complètement.
          this.categoriesFormArray.clear(); // On vide aussi la liste des catégories.
        }
      }
    }

    // Sécurité supplémentaire: Si la modale devient visible (`isVisible` passe à true)
    // mais que pour une raison quelconque le formulaire n'était pas prêt, on l'initialise.
    if (changes['isVisible']?.currentValue === true && !this.eventForm) {
      this.initForm();
      // Et si on était censé être en mode édition, on tente de remplir le formulaire.
      if (this.isEditMode && this.event) {
        this.populateFormForEdit();
      }
    }
  }

  // --- ------------------------------------- ---
  // --- LOGIQUE DE GESTION DU FORMULAIRE ---
  // --- ------------------------------------- ---

  /**
   * Initialise la structure du FormGroup `eventForm` avec tous ses contrôles et validateurs.
   * Cette structure doit correspondre aux champs de votre formulaire HTML.
   */
  initForm(): void {
    this.eventForm = this.fb.group({
      // Champ 'nom': valeur initiale vide (''), règles de validation (requis, longueur min/max)
      nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      // Champ 'start': requis. La valeur sera une chaîne formatée pour datetime-local.
      start: ['', Validators.required],
      // Champ 'end': requis. Idem.
      end: ['', Validators.required],
      // Champ 'description': requis, longueur max.
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      // Champ 'location': optionnel, longueur max.
      location: ['', Validators.maxLength(255)],
      // Champ 'categories': C'est un FormArray (une liste) qui contiendra des FormGroup (chaque catégorie).
      // Il est requis d'avoir au moins une catégorie (grâce à Validators.required sur le FormArray lui-même).
      categories: this.fb.array([], Validators.required) // Initialisé comme une liste vide.
    }, {
      // Options globales pour le FormGroup : ajout d'un validateur personnalisé pour tout le formulaire.
      validators: this.dateOrderValidator
    });
  }

  /**
   * Remplit le formulaire `eventForm` avec les données d'un événement existant (`this.event`).
   * Appelée par `ngOnChanges` lorsqu'on passe en mode édition.
   */
  populateFormForEdit(): void {
    // 1. Sécurité: Si `this.event` est undefined, on ne fait rien.
    if (!this.event) return;
    console.log('[Modal populateForm] Événement à utiliser:', this.event); // Log

    // 2. Capture de l'événement dans une constante pour satisfaire TypeScript dans setTimeout.
    const eventData = this.event;

    // 3. Formatage des dates: L'input HTML type="datetime-local" attend "YYYY-MM-DDTHH:mm".
    const formatForInput = 'yyyy-MM-ddTHH:mm'; // Format requis par <input type="datetime-local">
    // On utilise DatePipe pour convertir la date (qui vient de l'API, ex: ISO string) au format attendu.
    const formattedStart = this.datePipe.transform(eventData.start, formatForInput) ?? ''; // '?? '' ' = si transform échoue, mettre vide.
    const formattedEnd = this.datePipe.transform(eventData.end, formatForInput) ?? '';
    console.log('[Modal populateForm] Dates formatées (start, end):', formattedStart, formattedEnd); // Log

    // 4. Utilisation de setTimeout(..., 0):
    //    Corrige le problème où le formulaire ne se mettait pas à jour visuellement immédiatement
    //    à cause de la stratégie ChangeDetectionStrategy.OnPush du parent.
    //    Cela reporte l'exécution juste après le cycle actuel, donnant le temps à Angular de synchroniser.
    setTimeout(() => {
      // 5. Remplissage des champs simples: `patchValue` met à jour les contrôles correspondants dans eventForm.
      this.eventForm.patchValue({
        nom: eventData.nom,
        start: formattedStart,         // Utilise la date formatée
        end: formattedEnd,             // Utilise la date formatée
        description: eventData.description,
        location: eventData.location || '' // Met '' si la location est null/undefined
      });
      console.log('[Modal populateForm] APRES patchValue (dans setTimeout), valeurs formulaire:', this.eventForm.value); // Log

      // 6. Remplissage de la liste des catégories (FormArray):
      this.categoriesFormArray.clear(); // On vide d'abord le FormArray au cas où il contenait déjà des éléments.
      console.log('[Modal populateForm] FormArray catégories vidé (dans setTimeout).'); // Log
      // On boucle sur les catégories de l'événement reçu...
      eventData.categories.forEach(cat => {
        console.log('[Modal populateForm] Ajout catégorie au FormArray (dans setTimeout):', cat); // Log
        // ...et pour chacune, on crée un FormGroup correspondant (avec id, nom, capacité)...
        const categoryGroup = this.createCategoryGroup(cat.id, cat.nom, cat.capacite);
        // ...puis on ajoute ce FormGroup au FormArray.
        this.categoriesFormArray.push(categoryGroup);
      });
      console.log('[Modal populateForm] APRES remplissage catégories (dans setTimeout), valeur FormArray:', this.categoriesFormArray.value); // Log

      // 7. Forcer la détection de changement:
      //    Indique explicitement à Angular de vérifier ce composant et mettre à jour son template HTML.
      //    Nécessaire ici à cause du setTimeout et potentiellement de OnPush dans le parent.
      console.log('[Modal populateForm] Forçage détection de changements (dans setTimeout)...');
      this.cdr.detectChanges();
    }, 0); // Le délai 0 exécute ceci dès que possible après le cycle actuel.
  }

  /**
   * Raccourci pratique pour accéder au FormArray 'categories' depuis le template HTML.
   * Ex: `*ngFor="let categoryCtrl of categoriesFormArray.controls; let i = index"`
   */
  get categoriesFormArray(): FormArray {
    // On récupère le contrôle nommé 'categories' et on le "caste" en FormArray.
    return this.eventForm.get('categories') as FormArray;
  }

  /**
   * Crée et retourne un FormGroup représentant UNE SEULE catégorie.
   * Utilisé pour remplir le FormArray (`populateFormForEdit`) et pour ajouter de nouvelles catégories (`addCategory`).
   * @param id - L'ID de la catégorie (venu de l'API si existante, sinon null). CRUCIAL pour les mises à jour.
   * @param nom - Le nom initial de la catégorie.
   * @param capacite - La capacité initiale de la catégorie.
   * @returns Un FormGroup contenant les contrôles 'id', 'nom', 'capacite'.
   */
  createCategoryGroup(id: number | null = null, nom: string = '', capacite: number | null = null): FormGroup {
    return this.fb.group({
      // Champ 'id': ne sera pas affiché à l'utilisateur mais est essentiel pour le backend lors de la mise à jour.
      // Il est 'null' pour une catégorie qu'on vient d'ajouter via le bouton "Ajouter".
      id: [id],
      // Champ 'nom' avec ses validateurs.
      nom: [nom, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      // Champ 'capacite' avec ses validateurs (requis, minimum 0).
      capacite: [capacite, [Validators.required, Validators.min(0)]]
    });
  }

  /**
   * Ajoute un nouveau FormGroup (représentant une catégorie vide) au FormArray 'categories'.
   * Appelée par le bouton "Ajouter une catégorie" dans le HTML.
   */
  addCategory(): void {
    // Crée un groupe avec des valeurs par défaut (id=null, nom='', capacite=null)
    const newCategoryGroup = this.createCategoryGroup();
    // L'ajoute à la fin de la liste gérée par le FormArray.
    this.categoriesFormArray.push(newCategoryGroup);
  }

  /**
   * Supprime un FormGroup de catégorie du FormArray à une position (index) donnée.
   * Appelée par le bouton "supprimer" à côté de chaque catégorie dans le HTML.
   * @param index - La position de la catégorie à supprimer dans la liste.
   */
  removeCategory(index: number): void {
    this.categoriesFormArray.removeAt(index);
  }

  /**
   * Validateur personnalisé appliqué au FormGroup principal.
   * Vérifie si la date de début est bien antérieure à la date de fin.
   * @param control - Le contrôle auquel ce validateur est attaché (ici, c'est `eventForm`).
   * @returns Un objet d'erreur `{ 'dateOrderInvalid': true }` si la validation échoue, sinon `null`.
   */
  dateOrderValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const startValue = control.get('start')?.value; // Récupère la valeur du champ 'start'
    const endValue = control.get('end')?.value;     // Récupère la valeur du champ 'end'

    // Si les deux dates sont présentes et que start >= end...
    if (startValue && endValue && new Date(startValue) >= new Date(endValue)) {
      return {'dateOrderInvalid': true}; // ... signaler une erreur.
    }
    return null; // ... sinon, tout va bien (pas d'erreur).
  }

  // --- ------------------------- ---
  // --- LOGIQUE DE SAUVEGARDE ---
  // --- ------------------------- ---

  /**
   * Fonction principale appelée lorsque l'utilisateur clique sur le bouton "Enregistrer".
   * Gère à la fois la CRÉATION et la MISE À JOUR en fonction de `this.isEditMode`.
   */
  saveChanges(): void {
    // 1. Vérifier la validité du formulaire
    if (this.eventForm.invalid) {
      this.notificationService.show('Formulaire invalide. Veuillez vérifier les champs en rouge.', 'warning');
      this.eventForm.markAllAsTouched();
      return; // Arrêter le processus de sauvegarde.
    }

    // 2. Préparation de la sauvegarde
    this.isSaving = true; // Activer l'état "sauvegarde en cours"
    // Si tu utilises OnPush, force la détection pour afficher le spinner/désactiver le bouton
    // this.cdr.detectChanges(); // Décommente si nécessaire

    const formValue = this.eventForm.getRawValue();

    // Fonction utilitaire pour formater la date pour le backend
    const formatForBackend = (dateString: string): string => {
      return dateString ? dateString + ':00' : ''; // Ajoute ':00' pour les secondes. Adapte si besoin.
    };

    // 3. Logique différente selon le mode (Création ou Modification)
    if (this.isEditMode && this.event?.id) { // Utilise optional chaining pour l'ID
      // --- CAS: MISE À JOUR D'UN ÉVÉNEMENT EXISTANT ---
      console.log('DEBUG: Préparation UPDATE pour event ID:', this.event.id);

      const updatePayload: UpdateEventPayload = {
        nom: formValue.nom,
        start: formatForBackend(formValue.start),
        end: formatForBackend(formValue.end),
        description: formValue.description,
        location: formValue.location || undefined,
        categories: formValue.categories // Assume que le backend gère les IDs dans cette liste
      };

      console.log('DEBUG: Appel UPDATE avec payload:', updatePayload);
      // Appel de la méthode du service pour la mise à jour.
      this.eventService.updateEventWithCategories(this.event.id, updatePayload)
        .subscribe({
          next: (updatedEvent) => {
            this.notificationService.show('Événement mis à jour avec succès!', 'success');
            this.isSaving = false;
            this.saveSuccess.emit(updatedEvent); // Émettre l'événement mis à jour au parent.
            // La fermeture peut être gérée par le parent ou ici
          },
          error: (err) => {
            console.error("Erreur MàJ Événement:", err);
            this.notificationService.show(`Erreur lors de la mise à jour: ${err.message || 'Erreur inconnue'}`, 'error');
            this.isSaving = false;
            // this.cdr.detectChanges(); // Si OnPush
          }
        });

    } else if (!this.isEditMode) {
      // --- CAS: CRÉATION D'UN NOUVEL ÉVÉNEMENT ---
      console.log('DEBUG: Préparation CREATE');

      // === CORRECTION ===
      // Récupérer l'ID du club ICI, juste avant l'appel, depuis AuthService
      const clubId = this.authService.getManagedClubId(); // Ou this.authService.getUserId() selon besoin API

      // Vérifier si on a bien récupéré un ID de club
      if (clubId === null) {
        console.error("Erreur: Impossible de récupérer l'ID du club/organisateur pour la création.");
        this.notificationService.show("ID du club/organisateur introuvable pour la création.", "error");
        this.isSaving = false; // Arrêter l'état de sauvegarde
        // this.cdr.detectChanges(); // Si OnPush
        return; // Arrêter le processus
      }
      // === FIN CORRECTION ===

      // Préparer le Payload pour la création.
      const createCategoriesPayload: CategorieCreatePayload[] = formValue.categories.map((cat: any) => ({
        nom: cat.nom,
        capacite: cat.capacite
        // On s'assure qu'aucun ID n'est envoyé pour les catégories en création
      }));

      const createPayload: CreateEventPayload = {
        nom: formValue.nom,
        start: formatForBackend(formValue.start),
        end: formatForBackend(formValue.end),
        description: formValue.description,
        location: formValue.location || undefined,
        categories: createCategoriesPayload
      };

      console.log('DEBUG: Appel CREATE pour club ID:', clubId, 'Payload:', createPayload);
      // Appel de la méthode du service pour la création, en utilisant la variable locale clubId
      this.eventService.createEventWithCategories(clubId, createPayload)
        .subscribe({
          next: (createdEvent) => {
            this.notificationService.show('Événement créé avec succès!', 'success');
            this.isSaving = false;
            this.saveSuccess.emit(createdEvent); // Émettre l'événement NOUVELLEMENT créé au parent.
            // La fermeture peut être gérée par le parent ou ici
          },
          error: (err) => {
            console.error("Erreur Création Événement:", err);
            this.notificationService.show(`Erreur lors de la création: ${err.message || 'Erreur inconnue'}`, 'error');
            this.isSaving = false;
            // this.cdr.detectChanges(); // Si OnPush
          }
        });
    } else {
      // Sécurité: Cas anormal où le mode n'est pas clair (devrait pas arriver si isEditMode est bien géré)
      console.error("Erreur interne: Mode de sauvegarde indéfini.");
      this.notificationService.show("Une erreur interne est survenue lors de la sauvegarde.", "error");
      this.isSaving = false;
      // this.cdr.detectChanges(); // Si OnPush
    }
  }


  // --- ---------------- ---
  // --- FERMETURE ---
  // --- ---------------- ---

  // Ajoute cette méthode si elle n'existe pas ou si tu veux que la modale se ferme elle-même après succès
// Elle est aussi appelée par le bouton Annuler/Fermer de la modale
  closeModal(): void {
    if (this.isSaving) return; // Optionnel: Empêche de fermer pendant la sauvegarde
    this.close.emit(); // Émet juste l'événement pour que le parent ferme (via isVisible = false)
  }
}
