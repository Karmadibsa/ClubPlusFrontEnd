// Importations nécessaires pour Angular, les formulaires, les icônes, etc.
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms'; // FormBuilder, FormGroup, FormArray sont les outils des Reactive Forms
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
// Importations de vos services et modèles (interfaces)
import { NotificationService } from '../../../service/notification.service';
import { EventService } from '../../../service/event.service';
// Importez les interfaces/types définis dans vos fichiers de modèles
import { Evenement, CreateEventPayload, UpdateEventPayload } from '../../../model/evenement'; // Ajustez chemin
import { Categorie, CategorieCreatePayload, CategorieUpdatePayload } from '../../../model/categorie'; // Ajustez chemin

@Component({
  selector: 'app-edit-event', // Le nom de la balise HTML pour utiliser ce composant: <app-edit-event>
  standalone: true, // Indique que c'est un composant "autonome" (style Angular récent)
  imports: [
    CommonModule, // Pour *ngIf, *ngFor etc.
    ReactiveFormsModule, // ESSENTIEL pour utiliser FormGroup, FormArray, formControlName etc.
    LucideAngularModule // Pour les icônes
  ],
  templateUrl: './edit-event.component.html', // Le fichier HTML associé
  styleUrls: ['./edit-event.component.scss'] // Le fichier CSS/SCSS associé
})
export class EditEventModalComponent implements OnInit, OnChanges {

  // --- Inputs: Données venant du composant parent ---
  @Input() isVisible = false; // Le parent dit si la modale doit être visible
  @Input() event?: Evenement; // Reçoit l'événement à modifier (si en mode édition)
  @Input() clubId?: number; // Reçoit l'ID du club (si en mode création)

  // --- Outputs: Événements envoyés au composant parent ---
  @Output() saveSuccess = new EventEmitter<Evenement>(); // Signale une sauvegarde réussie, en renvoyant l'événement créé/mis à jour
  @Output() close = new EventEmitter<void>(); // Signale que la modale doit être fermée

  // --- Services Injectés (outils mis à disposition) ---
  private fb = inject(FormBuilder); // Outil Angular pour créer des formulaires réactifs facilement
  private eventService = inject(EventService); // Votre service pour parler à l'API backend
  private notificationService = inject(NotificationService); // Votre service pour afficher des messages à l'utilisateur

  // --- Propriétés du Composant ---
  eventForm!: FormGroup; // La variable qui contiendra notre structure de formulaire (créée avec FormBuilder)
  isSaving = false; // Pour savoir si un appel API est en cours (utile pour désactiver boutons/afficher spinner)
  isEditMode = false; // Pour savoir si on crée ou si on modifie un événement

  // --- Méthodes du Cycle de Vie Angular ---

  // Exécutée une fois quand le composant est créé
  ngOnInit(): void {
    this.initForm(); // Initialise la structure vide du formulaire
  }

  // Exécutée quand les @Input() changent (ex: quand 'event' est fourni par le parent)
  ngOnChanges(changes: SimpleChanges): void {
    // Si l'@Input 'event' change ET qu'il a une valeur (on nous donne un événement à éditer)
    if (changes['event'] && this.event) {
      this.isEditMode = true; // On passe en mode édition
      if (this.eventForm) { // Si le formulaire existe déjà
        this.populateFormForEdit(); // On le remplit avec les données de l'événement
      }
      // Si 'event' change ET qu'il devient vide (on passe d'édition à création, peu probable)
    } else if (changes['event'] && !this.event) {
      this.isEditMode = false; // On passe en mode création
      if (this.eventForm) { // Si le formulaire existe déjà
        this.eventForm.reset(); // On le vide
        this.categoriesFormArray.clear(); // On vide la liste des catégories
      }
    }

    // Cas spécial: si la modale devient visible MAIS que le formulaire n'a pas encore été créé
    // (peut arriver si ngOnChanges est appelée avant ngOnInit dans certains scénarios)
    if (changes['isVisible']?.currentValue === true && !this.eventForm) {
      this.initForm(); // Créer le formulaire
      if (this.isEditMode && this.event) { // Et le remplir si on est en mode édition
        this.populateFormForEdit();
      }
    }
  }

  // --- Logique de Gestion du Formulaire ---

  // Crée la structure de base du formulaire avec FormBuilder
  initForm(): void {
    this.eventForm = this.fb.group({
      // Champ 'nom': valeur initiale vide, règles (requis, longueur min/max)
      nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      // Champ 'start': valeur initiale vide, règle (requis)
      start: ['', Validators.required],
      // Champ 'end': valeur initiale vide, règle (requis)
      end: ['', Validators.required],
      // Champ 'description': valeur initiale vide, règles (requis, longueur max)
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      // Champ 'location': valeur initiale vide, règle (longueur max)
      location: ['', Validators.maxLength(255)],
      // Champ 'categories': C'est une LISTE (FormArray) de groupes. Requis (doit contenir au moins une catégorie ? à vérifier)
      categories: this.fb.array([], Validators.required) // Initialement vide
    }, { validators: this.dateOrderValidator }); // Ajoute une règle globale au formulaire (start avant end)
  }

  // Remplit le formulaire avec les données d'un événement existant
  populateFormForEdit(): void {
    if (!this.event) return; // Sécurité: si pas d'événement, on ne fait rien

    // Fonction interne pour formater une date ISO en 'YYYY-MM-DDTHH:mm' pour l'input HTML
    const formatForInput = (dateString: string | undefined): string => {
      // ... (logique de formatage comme avant) ...
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - (offset*60*1000));
        return adjustedDate.toISOString().slice(0, 16);
      } catch (e) {
        console.error("Erreur formatage date:", dateString, e);
        return '';
      }
    };

    // Met à jour les valeurs des champs simples du formulaire
    this.eventForm.patchValue({
      nom: this.event.nom, // Utilise le champ 'nom'
      start: formatForInput(this.event.start),
      end: formatForInput(this.event.end),
      description: this.event.description,
      location: this.event.location || '' // Met une chaîne vide si location est null/undefined
    });

    // Gérer la liste des catégories
    this.categoriesFormArray.clear(); // Vider la liste actuelle dans le formulaire
    // Pour chaque catégorie de l'événement reçu...
    this.event.categories.forEach(cat => {
      // ...on crée un groupe de formulaire pour elle et on l'ajoute à la liste (FormArray)
      // On passe l'id, le nom, la capacité existants
      this.categoriesFormArray.push(this.createCategoryGroup(cat.id, cat.nom, cat.capacite));
    });
  }


  // Raccourci pratique pour accéder à la liste (FormArray) des catégories dans le template HTML
  get categoriesFormArray(): FormArray {
    // 'as FormArray' dit à TypeScript: "fais confiance, c'est bien un FormArray"
    return this.eventForm.get('categories') as FormArray;
  }

  // Crée la structure (FormGroup) pour UNE SEULE catégorie dans la liste
  createCategoryGroup(id: number | null = null, nom: string = '', capacite: number | null = null): FormGroup {
    // Utilise FormBuilder pour créer un groupe avec les champs 'id', 'nom', 'capacite'
    return this.fb.group({
      id: [id], // Champ pour stocker l'ID (important pour la mise à jour). Sera null si nouvelle catégorie.
      nom: [nom, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]], // Champ nom avec règles
      capacite: [capacite, [Validators.required, Validators.min(0)]] // Champ capacité avec règles
    });
  }

  // Ajoute une nouvelle catégorie (vide) au formulaire
  addCategory(): void {
    // On crée un groupe vide avec createCategoryGroup() et on l'ajoute à la fin de la liste (FormArray)
    this.categoriesFormArray.push(this.createCategoryGroup());
  }

  // Supprime une catégorie du formulaire à une position donnée (index)
  removeCategory(index: number): void {
    // Retire l'élément à la position 'index' de la liste (FormArray)
    this.categoriesFormArray.removeAt(index);
  }

  // Règle de validation personnalisée pour vérifier que start est avant end
  dateOrderValidator(control: AbstractControl): { [key: string]: boolean } | null {
    // AbstractControl représente ici le FormGroup principal 'eventForm'
    const start = control.get('start')?.value; // Récupère la valeur du champ 'start'
    const end = control.get('end')?.value; // Récupère la valeur du champ 'end'
    // Si les deux dates existent et que start est après ou en même temps que end...
    if (start && end && new Date(start) >= new Date(end)) {
      return { 'dateOrderInvalid': true }; // ...retourne un objet d'erreur
    }
    return null; // ...sinon, retourne null (pas d'erreur)
  }

  // --- Logique de Sauvegarde ---

  // Fonction appelée quand l'utilisateur clique sur "Enregistrer"
  saveChanges(): void {
    // 1. Vérifier si le formulaire est valide (respecte toutes les règles Validators)
    if (this.eventForm.invalid) {
      this.notificationService.show('Formulaire invalide. Veuillez vérifier les champs.', 'warning');
      this.eventForm.markAllAsTouched(); // Force l'affichage des messages d'erreur dans le HTML
      return; // Arrêter la sauvegarde
    }

    // 2. Préparer la sauvegarde
    this.isSaving = true; // Indiquer qu'on sauvegarde (pour feedback UI)
    // Récupère TOUTES les valeurs du formulaire, y compris les 'id' dans les catégories
    const formValue = this.eventForm.getRawValue();

    // Fonction interne pour formater la date pour l'envoi au backend (potentiellement format ISO complet)
    const formatForBackend = (dateString: string): string => {
      // Ajoute juste ':00' pour faire YYYY-MM-DDTHH:mm:ss. Adaptez si le backend attend un fuseau horaire.
      return dateString ? dateString + ':00' : '';
    }

    // 3. Déterminer si on crée ou on met à jour
    if (this.isEditMode && this.event) {
      // --- CAS MISE À JOUR ---

      // Préparer le Payload (l'objet à envoyer à l'API) en utilisant l'interface `UpdateEventPayload`
      const updatePayload: UpdateEventPayload = {
        nom: formValue.nom,
        start: formatForBackend(formValue.start),
        end: formatForBackend(formValue.end),
        description: formValue.description,
        location: formValue.location || undefined, // Mettre undefined si vide, pour ne pas envoyer "" si non souhaité
        // La liste des catégories vient directement du formulaire.
        // `formValue.categories` a déjà la structure [{id: number|null, nom: string, capacite: number}, ...]
        // ce qui correspond à `CategorieUpdatePayload[]` attendu par l'interface `UpdateEventPayload`.
        categories: formValue.categories as CategorieUpdatePayload[] // On dit à TS que ça correspond
      };

      // Appeler le service pour mettre à jour
      this.eventService.updateEventWithCategories(this.event.id, updatePayload)
        .subscribe({ // Attend la réponse de l'API
          next: (updatedEvent) => { // Si succès...
            this.notificationService.show('Événement mis à jour avec succès!', 'valid');
            this.isSaving = false; // Arrêter l'indicateur de sauvegarde
            this.saveSuccess.emit(updatedEvent); // Envoyer l'événement mis à jour au parent
            this.closeModal(); // Fermer la modale
          },
          error: (err) => { // Si erreur...
            this.notificationService.show(`Erreur lors de la mise à jour: ${err.message}`, 'error');
            this.isSaving = false; // Arrêter l'indicateur de sauvegarde
          }
        });

    } else if (!this.isEditMode && this.clubId) {
      // --- CAS CRÉATION ---

      // Préparer le Payload (l'objet à envoyer à l'API) en utilisant l'interface `CreateEventPayload`
      // Pour les catégories, on doit enlever l'ID (qui est null dans le formulaire pour les nouvelles)
      const createCategoriesPayload: CategorieCreatePayload[] = formValue.categories.map((cat: CategorieUpdatePayload) => ({
        // On crée un nouvel objet pour chaque catégorie avec seulement nom et capacite
        nom: cat.nom,
        capacite: cat.capacite
      }));

      const createPayload: CreateEventPayload = {
        nom: formValue.nom,
        start: formatForBackend(formValue.start),
        end: formatForBackend(formValue.end),
        description: formValue.description,
        location: formValue.location || undefined,
        categories: createCategoriesPayload // Utilise la liste sans les IDs
      };

      // Appeler le service pour créer
      this.eventService.createEventWithCategories(this.clubId, createPayload)
        .subscribe({ // Attend la réponse de l'API
          next: (createdEvent) => { // Si succès...
            this.notificationService.show('Événement créé avec succès!', 'valid');
            this.isSaving = false;
            this.saveSuccess.emit(createdEvent); // Envoyer l'événement créé au parent
            this.closeModal();
          },
          error: (err) => { // Si erreur...
            this.notificationService.show(`Erreur lors de la création: ${err.message}`, 'error');
            this.isSaving = false;
          }
        });
    } else {
      // Cas d'erreur bizarre où le mode n'est pas clair ou clubId manque
      console.error("Erreur: Mode indéfini ou clubId manquant pour la création.");
      this.notificationService.show("Erreur interne lors de la sauvegarde.", "error");
      this.isSaving = false;
    }
  }

  // --- Fermeture ---

  // Fonction appelée par le bouton "Annuler" ou le clic sur l'overlay
  closeModal(): void {
    // Optionnel: Vider le formulaire quand on ferme ?
    // this.eventForm.reset();
    // this.categoriesFormArray.clear();
    this.close.emit(); // Signale au parent de fermer la modale
  }
}
