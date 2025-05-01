import { Component } from '@angular/core';
import {EventCardComponent} from "../../../component/event/eventcard/eventcard.component";
import {FilterEventComponent} from "../../../component/event/filter-event/filter-event.component";
import {LucideAngularModule} from "lucide-angular";
import {PaginationComponent} from "../../../component/navigation/pagination/pagination.component";

@Component({
  selector: 'app-template',
    imports: [
        EventCardComponent,
        FilterEventComponent,
        LucideAngularModule,
        PaginationComponent
    ],
  templateUrl: './template.component.html',
  styleUrl: './template.component.scss'
})
export class TemplateComponent {

}
