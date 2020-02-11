import { Component, OnDestroy, ViewChild } from "@angular/core";
import { ICompetitionSetup } from "./models/competition-setup.model";
import { AzureFunctionsService } from "./services/azure-functions.service";
import { IOrchestrationInfo } from "./models/orchestration-info.model";
import { Subject, Observable, timer, Subscription } from "rxjs";
import { takeUntil, take } from "rxjs/operators";
import { debug } from "util";
import {
  IgxRadialGaugeComponent,
  IgxRadialGaugeRangeComponent,
  RadialGaugePivotShape,
  RadialGaugeNeedleShape
} from "igniteui-angular-gauges";
import { SweepDirection } from "igniteui-angular-core";

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

  @ViewChild("radialGauge", { static: true })
  public radialGauge: IgxRadialGaugeComponent;

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
            if (
              !!status.customStatus &&
              JSON.parse(status.customStatus).Stage === "Completed"
            ) {
              this.competitionMonitoringSubscription.unsubscribe();
              //this.stopAllSubscriptions.next();
            }
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
              status.hasOwnProperty("customStatus") &&
              !!status.customStatus &&
              (JSON.parse(status.customStatus).Stage === "CollectingPleas" ||
                JSON.parse(status.customStatus).Stage === "Completed") &&
              !!JSON.parse(status.customStatus).Payload.Pleas
            ) {
              this.matchStatuss[matchIndex] = {
                stage: JSON.parse(status.customStatus).Stage,
                numberOfGames: status.input.NumberOfGames,
                gamesComplete: JSON.parse(status.customStatus).Payload.Pleas
                  .length,
                Player1: JSON.parse(status.customStatus).Payload.Player1.Name,
                Player2: JSON.parse(status.customStatus).Payload.Player2.Name,
                player1Rats: JSON.parse(
                  status.customStatus
                ).Payload.Pleas.filter(p => p.Player1 === "Rat").length,
                player2Rats: JSON.parse(
                  status.customStatus
                ).Payload.Pleas.filter(p => p.Player2 === "Rat").length
              };
            }
            // this.matchStatuss[matchIndex] = status;

            if (
              status.runtimeStatus === "Terminated" ||
              (!!status.customStatus &&
                JSON.parse(status.customStatus).Stage === "Completed")
            ) {
              this.matchMonitoringSubscriptions[matchIndex].unsubscribe();
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

  public AnimateToGauge1(): void {
    this.radialGauge.height = "330px";
    this.radialGauge.width = "100%";

    this.radialGauge.minimumValue = 0;
    this.radialGauge.maximumValue = 10;
    this.radialGauge.value = 7.5;

    // Scale Settings
    this.radialGauge.scaleStartAngle = 200;
    this.radialGauge.scaleEndAngle = -20;
    this.radialGauge.scaleBrush = "transparent";
    this.radialGauge.scaleSweepDirection = SweepDirection.Clockwise;

    // Backing Settings
    this.radialGauge.backingOutline = "white";
    this.radialGauge.backingBrush = "white";

    // Needle Settings
    this.radialGauge.needleEndExtent = 0.8;
    this.radialGauge.needleShape = RadialGaugeNeedleShape.Triangle;
    this.radialGauge.needlePivotShape = RadialGaugePivotShape.Circle;
    this.radialGauge.needlePivotWidthRatio = 0.1;
    this.radialGauge.needleBrush = "#79797a";
    this.radialGauge.needleOutline = "#79797a";

    // TickMark Settings
    this.radialGauge.tickBrush = "transparent";
    this.radialGauge.minorTickBrush = "transparent";

    // Label Settings
    this.radialGauge.labelInterval = 10;
    this.radialGauge.labelExtent = 1;
    this.radialGauge.font = "15px Verdana,Arial";

    // setting custom gauge ranges
    const range1 = new IgxRadialGaugeRangeComponent();
    range1.startValue = 0;
    range1.endValue = 5;
    const range2 = new IgxRadialGaugeRangeComponent();
    range2.startValue = 5;
    range2.endValue = 10;

    this.radialGauge.rangeBrushes = ["#a4bd29", "#F86232"];
    this.radialGauge.rangeOutlines = ["#a4bd29", "#F86232"];
    this.radialGauge.ranges.clear();
    this.radialGauge.ranges.add(range1);
    this.radialGauge.ranges.add(range2);

    // setting extent of all gauge ranges
    for (let i = 0; i < this.radialGauge.ranges.count; i++) {
      const range = this.radialGauge.ranges.item(i);
      range.innerStartExtent = 0.3;
      range.innerEndExtent = 0.3;
      range.outerStartExtent = 0.9;
      range.outerEndExtent = 0.9;
    }
  }

  ngOnDestroy() {
    this.stopAllSubscriptions.next();
    this.stopAllSubscriptions.unsubscribe();
  }
}
