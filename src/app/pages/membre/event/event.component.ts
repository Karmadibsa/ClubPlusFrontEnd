import {Component, inject} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {
  EventCardComponent
} from "../../../component/event/calendar/eventcard.component";
import {NgForOf} from "@angular/common";
import {LucideAngularModule} from "lucide-angular";
import {SidebarComponent} from '../../../component/navigation/sidebar/sidebar.component';
import {HttpClient} from '@angular/common/http';

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
  http = inject(HttpClient)
  events: Event[] = []

  ngOnInit() {
    this.http.get<Event[]>("http://localhost:8080/api/events")
      .subscribe(listeevents => this.events = listeevents)
  }

}
