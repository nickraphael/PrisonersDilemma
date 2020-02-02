import { Component, OnDestroy } from "@angular/core";
import { ICompetitionSetup } from "./models/competition-setup.model";
import { AzureFunctionsService } from "./services/azure-functions.service";
import { IOrchestrationInfo } from "./models/orchestration-info.model";
import { Subject, Observable, timer } from "rxjs";
import { takeUntil, take } from "rxjs/operators";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnDestroy {
  title = "PrisonersDilemmaUI";
  orchestrationInfo: IOrchestrationInfo;
  status: any;

  private onDestroy = new Subject();
  private onOrchestrationComplete = new Subject();

  constructor(private azureFunctionsService: AzureFunctionsService) {}

  initialiseCompetition(competitionSetup: ICompetitionSetup) {
    this.azureFunctionsService
      .startCompetition(competitionSetup)
      .pipe(takeUntil(this.onDestroy))
      .subscribe(orchestrationInfo => {
        this.orchestrationInfo = orchestrationInfo;
        this.startMonitoring(orchestrationInfo);
      });
  }

  startMonitoring(orchestrationInfo: IOrchestrationInfo) {
    timer(0, 1000)
      .pipe(takeUntil(this.onOrchestrationComplete))
      .subscribe(() => {
        this.azureFunctionsService
          .getOrchestrationStatus(orchestrationInfo.statusQueryGetUri)
          .pipe(take(1))
          .subscribe(status => {
            this.status = status;
            if (status.runtimeStatus === "Completed") {
              this.onOrchestrationComplete.next();
            }
          });
      });
  }

  terminate() {
    this.azureFunctionsService
      .terminateOrchestration(this.orchestrationInfo.terminatePostUri)
      .subscribe();
  }

  ngOnDestroy() {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
