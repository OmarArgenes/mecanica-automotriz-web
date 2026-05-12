import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleIntakeHomeComponent } from './vehicle-intake-home.component';

describe('VehicleIntakeHomeComponent', () => {
  let component: VehicleIntakeHomeComponent;
  let fixture: ComponentFixture<VehicleIntakeHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleIntakeHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleIntakeHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
