import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { CreateNewCompetitionComponent } from "./components/create-new-competition/create-new-competition.component";

import { HttpClientModule } from "@angular/common/http";
import { NgxJsonViewerModule } from "ngx-json-viewer";
import { MatProgressBarModule } from "@angular/material/progress-bar";

@NgModule({
  declarations: [AppComponent, CreateNewCompetitionComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgxJsonViewerModule,
    MatProgressBarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
