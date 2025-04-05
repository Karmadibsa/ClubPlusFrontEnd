type Evenement = {
  "id": number,
  "title": string,
  "start": string,
  "end": string,
  "description": string,
  "location": string,
  "categories": Categorie [],
  "reservations": Reservation [],
  "placeTotal": number,
  "placeReserve": number;
}
