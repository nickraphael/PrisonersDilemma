import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AzureFunctionsService } from "src/app/services/azure-functions.service";
import { IOrchestrationInfo } from "src/app/models/orchestration-info.model";
import { ICompetitionSetup } from "src/app/models/competition-setup.model";

@Component({
  selector: "app-create-new-competition",
  templateUrl: "./create-new-competition.component.html",
  styleUrls: ["./create-new-competition.component.css"]
})
export class CreateNewCompetitionComponent implements OnInit {
  @Output() competitionSetup: EventEmitter<
    ICompetitionSetup
  > = new EventEmitter<ICompetitionSetup>();

  setupForm: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.setupForm = this.fb.group({
      competitionSetup: [
        `
      {
        "BothInnocentYears": 1,
        "BothAccusedYears": 2,
        "OneAccusedYears": 3,
        "MinimumNumberOfGames": 15,
        "MaximumNumberOfGames": 15,
        "Players": [
        {
          "Name": "Nick",
          "ImageUri": "zzzzz"
        },
        {
          "Name": "Dave",
          "ImageUri": "xxxxx"
        },
        {
          "Name": "Nelly",
          "ImageUri": "xxxxx"
        }]
      }
      `,
        [Validators.required]
      ]
    });
  }

  startCompetition() {
    const competitionSetup: ICompetitionSetup = JSON.parse(
      this.setupForm.controls.competitionSetup.value
    );
    this.competitionSetup.emit(competitionSetup);
  }
}
