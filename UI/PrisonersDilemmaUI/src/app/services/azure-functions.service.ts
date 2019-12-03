import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { IOrchestrationInfo } from "../models/orchestration-info.model";
import { ICompetitionSetup } from "../models/competition-setup.model";

@Injectable({
  providedIn: "root"
})
export class AzureFunctionsService {
  constructor(private http: HttpClient) {}

  public startCompetition(setup: ICompetitionSetup) {
    return this.http.post<IOrchestrationInfo>(
      `http://localhost:7071/api/Orchestrator_HttpStart`,
      setup
    );
  }

  public getOrchestrationStatus(uri: string) {
    return this.http.get<any>(uri);
  }
}
