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
  stage: string;

  private onDestroy = new Subject();
  private onOrchestrationComplete = new Subject();

  constructor(private azureFunctionsService: AzureFunctionsService) {}

  initialiseCompetition(competitionSetup: ICompetitionSetup) {
    this.azureFunctionsService
      .startCompetition(competitionSetup)
      .pipe(takeUntil(this.onDestroy))
      .subscribe(orchestrationInfo => {
        this.orchestrationInfo = orchestrationInfo;
        this.startCompetitionMonitoring(orchestrationInfo);
      });
  }

  startCompetitionMonitoring(orchestrationInfo: IOrchestrationInfo) {
    timer(0, 1000)
      .pipe(takeUntil(this.onOrchestrationComplete))
      .subscribe(() => {
        this.azureFunctionsService
          .getOrchestrationStatus(orchestrationInfo.statusQueryGetUri)
          .pipe(take(1))
          .subscribe(status => {
            this.status = status;
            if (!!status.customStatus) {
              this.stage = JSON.parse(status.customStatus).Stage;
            }

            if (this.stage === "Running Matches") {
              const matchIndexes: number[] = JSON.parse(status.customStatus)
                .Payload;
              matchIndexes.forEach(matchIndex => {
                this.startMatchMonitoring(
                  orchestrationInfo.statusQueryGetUri,
                  matchIndex
                );
              });
            } else if (status.runtimeStatus === "Completed") {
              this.onOrchestrationComplete.next();
            }
          });
      });
  }

  startMatchMonitoring(statusQueryGetUri: string, matchIndex: number) {
    timer(0, 1000)
      .pipe(takeUntil(this.onOrchestrationComplete))
      .subscribe(() => {
        const insertIndex = statusQueryGetUri.indexOf("?taskHub");
        const matchStatusQueryGetUri = [
          statusQueryGetUri.slice(0, insertIndex),
          "_" + matchIndex,
          statusQueryGetUri.slice(insertIndex)
        ].join("");

        console.log(matchStatusQueryGetUri);

        this.azureFunctionsService
          .getOrchestrationStatus(matchStatusQueryGetUri)
          .pipe(take(1))
          .subscribe(status => {
            if (status.runtimeStatus === "CollectingPleas") {
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
