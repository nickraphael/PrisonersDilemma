import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewCompetitionComponent } from './create-new-competition.component';

describe('CreateNewCompetitionComponent', () => {
  let component: CreateNewCompetitionComponent;
  let fixture: ComponentFixture<CreateNewCompetitionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateNewCompetitionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewCompetitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
