import { Component, OnDestroy } from "@angular/core";
import { ICompetitionSetup } from "./models/competition-setup.model";
import { AzureFunctionsService } from "./services/azure-functions.service";
import { IOrchestrationInfo } from "./models/orchestration-info.model";
import { Subject, Observable, timer, Subscription } from "rxjs";
import { takeUntil, take } from "rxjs/operators";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnDestroy {
  title = "PrisonersDilemmaUI";
  orchestrationInfo: IOrchestrationInfo;

  competitionStatus: any;
  matchStatuss: any[] = [];

  stage: string;

  private stopAllSubscriptions = new Subject();

  private matchIndexes: number[] = [];

  competitionMonitoringSubscription: Subscription;
  matchMonitoringSubscriptions: Subscription[] = [];

  constructor(private azureFunctionsService: AzureFunctionsService) {}

  initialiseCompetition(competitionSetup: ICompetitionSetup) {
    this.azureFunctionsService
      .startCompetition(competitionSetup)
      .pipe(takeUntil(this.stopAllSubscriptions))
      .subscribe(orchestrationInfo => {
        this.orchestrationInfo = orchestrationInfo;
        this.startCompetitionMonitoring(orchestrationInfo);
      });

    this.stopAllSubscriptions.subscribe(x => {
      this.competitionMonitoringSubscription.unsubscribe();
      this.matchMonitoringSubscriptions.forEach(s => s.unsubscribe());
    });
  }

  startCompetitionMonitoring(orchestrationInfo: IOrchestrationInfo) {
    this.competitionMonitoringSubscription = timer(0, 2000)
      .pipe(takeUntil(this.stopAllSubscriptions))
      .subscribe(() => {
        this.azureFunctionsService
          .getOrchestrationStatus(orchestrationInfo.statusQueryGetUri)
          .pipe(take(1))
          .subscribe(status => {
            this.competitionStatus = status;
            if (!!status.customStatus) {
              this.stage = JSON.parse(status.customStatus).Stage;
            }

            if (
              this.matchMonitoringSubscriptions.length === 0 &&
              this.stage === "Running Matches"
            ) {
              this.matchIndexes = JSON.parse(status.customStatus).Payload;
              this.matchIndexes.forEach(matchIndex => {
                this.startMatchMonitoring(
                  orchestrationInfo.statusQueryGetUri,
                  matchIndex
                );
              });
            } // } else if (status.runtimeStatus === "Completed") {
            //   this.stopAllSubscriptions.next();
            // }
          });
      });
  }

  startMatchMonitoring(statusQueryGetUri: string, matchIndex: number) {
    this.matchMonitoringSubscriptions[matchIndex] = timer(0, 2000)
      .pipe(takeUntil(this.stopAllSubscriptions))
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
            console.log(`Got status for match ${matchIndex}`);

            if (
              (JSON.parse(status.customStatus).Stage === "CollectingPleas" ||
                JSON.parse(status.customStatus).Stage === "Completed") &&
              !!JSON.parse(status.customStatus).Payload.Pleas
            ) {
              this.matchStatuss[matchIndex] = {
                numberOfGames: status.input.NumberOfGames,
                gamesComplete: JSON.parse(status.customStatus).Payload.Pleas
                  .length,
                Player1JailTime: 5,
                Player2JailTime: 10
              };
            }
            // this.matchStatuss[matchIndex] = status;

            if (
              status.runtimeStatus === "Terminated" ||
              JSON.parse(status.customStatus).Stage === "Completed"
            ) {
              this.matchMonitoringSubscriptions[matchIndex].unsubscribe();
              //this.stopAllSubscriptions.next();
            }
          });
      });
  }

  terminate() {
    // stop monitoring
    this.stopAllSubscriptions.next();

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
    this.stopAllSubscriptions.next();
    this.stopAllSubscriptions.unsubscribe();
  }
}
