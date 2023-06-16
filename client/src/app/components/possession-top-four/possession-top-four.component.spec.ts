import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PossessionTopFourComponent } from './possession-top-four.component';

describe('PossessionTopFourComponent', () => {
  let component: PossessionTopFourComponent;
  let fixture: ComponentFixture<PossessionTopFourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PossessionTopFourComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PossessionTopFourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
