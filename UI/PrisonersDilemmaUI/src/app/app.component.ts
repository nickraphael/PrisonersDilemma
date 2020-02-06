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

  private matchIndexes: number[] = [];

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
              this.matchIndexes = JSON.parse(status.customStatus).Payload;
              this.matchIndexes.forEach(matchIndex => {
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

        this.azureFunctionsService
          .getOrchestrationStatus(matchStatusQueryGetUri)
          .pipe(take(1))
          .subscribe(status => {
            if (status.runtimeStatus === "CollectingPleas") {
              debugger;
            }
          });
      });
  }

  terminate() {
    // stop monitoring
    this.onOrchestrationComplete.next();

    // terminate competitionOrchastrator
    this.azureFunctionsService
      .terminateOrchestration(this.orchestrationInfo.terminatePostUri)
      .subscribe(
        x => {
          console.log("Competition orchestrator terminated");
        },
        err => {
          debugger;
        }
      );

    // terminate all matches
    this.matchIndexes.forEach(matchIndex => {
      const insertIndex = this.orchestrationInfo.terminatePostUri.indexOf(
        "/terminate"
      );
      const matchTerminatePostUri = [
        this.orchestrationInfo.terminatePostUri.slice(0, insertIndex),
        "_" + matchIndex,
        this.orchestrationInfo.terminatePostUri.slice(insertIndex)
      ].join("");

      this.azureFunctionsService
        .terminateOrchestration(matchTerminatePostUri)
        .subscribe(
          x => {
            console.log(`match ${matchIndex} terminated.`);
          },
          err => {
            debugger;
          }
        );
    });
  }

  ngOnDestroy() {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
