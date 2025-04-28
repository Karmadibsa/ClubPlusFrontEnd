import {Component, inject} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {
  EventCardComponent
} from "../../../component/event/eventcard/eventcard.component";
import {NgForOf} from "@angular/common";
import {LucideAngularModule} from "lucide-angular";
import {SidebarComponent} from '../../../component/navigation/sidebar/sidebar.component';
import {HttpClient} from '@angular/common/http';
import {Evenement} from '../../../model/evenement';
import {EventService} from '../../../service/event.service';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  imports: [
    FormsModule,
    EventCardComponent,
    NgForOf,
    LucideAngularModule,
    SidebarComponent,
  ],
  styleUrls: ['./event.component.scss']
})
export class EventComponent {
  private eventService = inject(EventService)
  http = inject(HttpClient)
  events: Evenement[] = []

  ngOnInit() {
    this.eventService.getAllEvents()
      .subscribe(listeevents => this.events = listeevents)
  }

}
