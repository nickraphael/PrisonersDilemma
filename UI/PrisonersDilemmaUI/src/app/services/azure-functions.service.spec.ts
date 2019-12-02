import { TestBed } from '@angular/core/testing';

import { AzureFunctionsService } from './azure-functions.service';

describe('AzureFunctionsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AzureFunctionsService = TestBed.get(AzureFunctionsService);
    expect(service).toBeTruthy();
  });
});
