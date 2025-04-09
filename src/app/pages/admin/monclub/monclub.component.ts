import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SidebarComponent} from '../../../component/navigation/sidebar/sidebar.component';
import {HttpClient} from '@angular/common/http';
import {LucideAngularModule} from 'lucide-angular';

@Component({
    selector: 'app-monclub',
  imports: [
    ReactiveFormsModule,
    SidebarComponent,
    LucideAngularModule
  ],
    templateUrl: './monclub.component.html',
    styleUrl: './monclub.component.scss'
})
export class MonclubComponent {
  clubForm!: FormGroup;
  private apiUrl = 'http://localhost:8080/api/club'; // URL de base pour l'API
  private clubId = 1; // ID du club à modifier (statique pour l'instant)

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadClubData();
  }

  // Initialisation du formulaire
  private initializeForm(): void {
    this.clubForm = this.fb.group({
      nom: ['', Validators.required],
      numero_voie: ['', Validators.required],
      rue: ['', Validators.required],
      codepostal: ['', Validators.required],
      ville: ['', Validators.required],
      telephone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      codeClub: [{ value: '', disabled: true }] // Lecture seule
    });
  }

  // Charger les données existantes du club depuis l'API
  private loadClubData(): void {
    this.http.get(`${this.apiUrl}/${this.clubId}`).subscribe(
      (data: any) => {
        this.clubForm.patchValue(data); // Charger les données dans le formulaire
      },
      (error) => {
        console.error('Erreur lors du chargement des données du club', error);
      }
    );
  }

  // Copier le code club dans le presse-papiers
  copyCodeClub(): void {
    const codeClub = this.clubForm.get('codeClub')?.value;
    if (codeClub) {
      navigator.clipboard.writeText(codeClub).then(
        () => console.log('Code Club copié dans le presse-papiers !'),
        (err) => console.error('Erreur lors de la copie dans le presse-papiers', err)
      );
    } else {
      console.error('Le Code Club est vide ou non disponible.');
    }
  }
  // Soumettre les modifications à l'API
  onSubmit(): void {
    if (this.clubForm.invalid) {
      alert('Veuillez remplir tous les champs requis.');
      return;
    }

    const updatedClubData = this.clubForm.value;

    this.http.patch(`${this.apiUrl}/${this.clubId}`, updatedClubData).subscribe(
      () => {
        alert('Les informations du club ont été mises à jour avec succès.');
      },
      (error) => {
        console.error('Erreur lors de la mise à jour des informations du club', error);
        alert('Une erreur est survenue lors de la mise à jour.');
      }
    );
  }

  // Réinitialiser le formulaire avec les données existantes
  onReset(): void {
    this.loadClubData();
  }
}
