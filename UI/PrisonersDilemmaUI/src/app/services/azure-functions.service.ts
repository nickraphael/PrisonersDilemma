import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: "root"
})
export class AzureFunctionsService {
  constructor(private http: HttpClient) {}

  public startCompetition(setup: string) {
    debugger;
    return this.http.post(
      `http://localhost:7071/api/Orchestrator_HttpStart`,
      JSON.parse(setup)
    );
  }
}
