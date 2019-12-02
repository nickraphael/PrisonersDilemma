import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AzureFunctionsService } from "src/app/services/azure-functions.service";

@Component({
  selector: "app-create-new-competition",
  templateUrl: "./create-new-competition.component.html",
  styleUrls: ["./create-new-competition.component.css"]
})
export class CreateNewCompetitionComponent implements OnInit {
  setupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private azureFunctionsService: AzureFunctionsService
  ) {}

  ngOnInit() {
    this.setupForm = this.fb.group({
      competitionSetup: [
        `
      {
        "BothInnocentYears": 1,
        "BothAccusedYears": 2,
          "OneAccusedYears": 3,
        "Players": [
        {
          "Name": "Nick",
          "ImageUri": "zzzzz"
        },
        {
          "Name": "Dave",
          "ImageUri": "xxxxx"
        }]
      }
      `,
        [Validators.required]
      ]
    });
  }

  startCompetition() {
    debugger;
    this.azureFunctionsService.startCompetition(
      this.setupForm.controls.competitionSetup.value
    );
  }
}
